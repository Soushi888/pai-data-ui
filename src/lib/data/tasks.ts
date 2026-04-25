import { Effect } from 'effect'
import type { DataError } from './errors.js'
import { ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType } from '$lib/server/index-db.js'
import type { EntityWithBody, Task, TimeLogEntry } from './types.js'

const dir = () => dataPath('PM', 'tasks')
const filePath = (id: string) => `${dir()}/${id}.md`

export function listTasks(): Effect.Effect<Task[], DataError> {
  return Effect.try({
    try: () => listByType<Task>('task'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}


export function getTask(id: string): Effect.Effect<EntityWithBody<Task>, DataError> {
  return requireEntity<Task>(filePath(id), id)
}

export function updateTask(
  id: string,
  patch: Partial<Task>,
  body?: string
): Effect.Effect<Task, DataError> {
  return Effect.flatMap(getTask(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch, updated: new Date().toISOString().split('T')[0] }
    return Effect.map(
      writeEntity(filePath(id), updated as unknown as Record<string, unknown>, body ?? existingBody),
      () => updated
    )
  })
}

export function appendTimeLog(
  id: string,
  entry: TimeLogEntry
): Effect.Effect<Task, DataError> {
  return Effect.flatMap(getTask(id), ({ data, body }) => {
    const updated: Task = {
      ...data,
      time_logs: [...(data.time_logs ?? []), entry],
      updated: new Date().toISOString().split('T')[0]
    }
    return Effect.map(
      writeEntity(filePath(id), updated as unknown as Record<string, unknown>, body),
      () => updated
    )
  })
}

export function createTask(
  data: Omit<Task, 'id' | 'type' | 'created' | 'updated'>,
  body = ''
): Effect.Effect<Task, DataError> {
  const today = new Date().toISOString().split('T')[0]
  const id = `task-${data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)}`
  const task: Task = { ...data, id, type: 'task', created: today, updated: today }
  return Effect.map(writeEntity(filePath(id), task as unknown as Record<string, unknown>, body), () => task)
}

export function totalHours(task: Task): number {
  return (task.time_logs ?? []).reduce((sum, e) => sum + e.hours, 0)
}

export function hoursThisWeek(task: Task): number {
  const monday = getMonday()
  return (task.time_logs ?? [])
    .filter((e) => e.date >= monday)
    .reduce((sum, e) => sum + e.hours, 0)
}

function getMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}
