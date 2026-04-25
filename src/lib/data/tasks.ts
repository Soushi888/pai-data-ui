import { Effect } from 'effect'
import type { DataError } from './errors.js'
import { ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType } from '$lib/server/index-db.js'
import type { EntityWithBody, Task, TimeLogEntry } from './types.js'

const dir = () => dataPath('PM', 'tasks')
const filePath = (id: string) => `${dir()}/${id}.md`

/**
 * Lists all tasks from the SQLite index.
 * @returns Effect resolving to Task[], or failing with DataError.
 */
export function listTasks(): Effect.Effect<Task[], DataError> {
  return Effect.try({
    try: () => listByType<Task>('task'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}


/**
 * Retrieves a single task by ID with markdown body.
 * @param id - Task identifier.
 * @returns Effect resolving to task data + body, or failing with DataError.
 */
export function getTask(id: string): Effect.Effect<EntityWithBody<Task>, DataError> {
  return requireEntity<Task>(filePath(id), id)
}

/**
 * Updates an existing task with a partial patch.
 * Sets the `updated` timestamp on every patch.
 * @param id - Identifier of the task to update.
 * @param patch - Fields to update; unspecified fields are preserved.
 * @param body - Optional replacement markdown body.
 * @returns Effect resolving to the updated Task, or failing with DataError.
 */
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

/**
 * Appends a time log entry to a task's time_logs array.
 * @param id - Task identifier.
 * @param entry - Time log entry to append (date, hours, optional notes).
 * @returns Effect resolving to the updated Task, or failing with DataError.
 */
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

/**
 * Creates a new task.
 * @param data - Task fields to set.
 * @param body - Optional initial markdown body.
 * @returns Effect resolving to the created Task, or failing with DataError.
 */
export function createTask(
  data: Omit<Task, 'id' | 'type' | 'created' | 'updated'>,
  body = ''
): Effect.Effect<Task, DataError> {
  const today = new Date().toISOString().split('T')[0]
  const id = `task-${data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)}`
  const task: Task = { ...data, id, type: 'task', created: today, updated: today }
  return Effect.map(writeEntity(filePath(id), task as unknown as Record<string, unknown>, body), () => task)
}

/**
 * Calculates the total hours logged across all time_logs entries for a task.
 * @param task - The task whose time logs to sum.
 * @returns Total hours as a number; returns 0 if no time logs exist.
 */
export function totalHours(task: Task): number {
  return (task.time_logs ?? []).reduce((sum, e) => sum + e.hours, 0)
}

/**
 * Calculates hours logged on a task since the most recent Monday (ISO week start).
 * @param task - The task whose time logs to filter.
 * @returns Hours logged in the current calendar week.
 */
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
