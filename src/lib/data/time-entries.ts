import { existsSync } from 'node:fs'
import { Effect as E } from 'effect'
import type { DataError } from './errors.js'
import { ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType, queryTimeEntries as dbQueryTimeEntries } from '$lib/server/index-db.js'
import type { EntityWithBody, TimeEntry } from './types.js'

const dir = () => dataPath('Time', 'entries')
const filePath = (id: string) => `${dir()}/${id}.md`

/**
 * Lists all time entries from the SQLite index, ordered by date descending.
 */
export function listTimeEntries(): E.Effect<TimeEntry[], DataError> {
  return E.try({
    try: () => listByType<TimeEntry>('time-entry'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}

/**
 * Retrieves a single time entry by ID with markdown body.
 */
export function getTimeEntry(id: string): E.Effect<EntityWithBody<TimeEntry>, DataError> {
  return requireEntity<TimeEntry>(filePath(id), id)
}

/**
 * Queries time entries with optional filtering (delegates to SQLite index).
 */
export function queryTimeEntries(opts: {
  taskId?: string
  projectId?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
} = {}): E.Effect<TimeEntry[], DataError> {
  return E.try({
    try: () => dbQueryTimeEntries(opts) as unknown as TimeEntry[],
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}

/**
 * Creates a new time entry file and indexes it.
 * Auto-generates an ID from date + task slug with collision resolution.
 */
export function createTimeEntry(
  data: Omit<TimeEntry, 'id' | 'type' | 'created'>,
  body = ''
): E.Effect<TimeEntry, DataError> {
  return E.try({
    try: () => {
      const today = new Date().toISOString().split('T')[0]
      const taskSlug = data.task_id
        ? data.task_id.replace(/^task-/, '')
        : data.project_id.replace(/^proj-/, '')
      const hours = Math.round((data.minutes / 60) * 4) / 4

      let id = `te-${data.date}-${taskSlug}`
      let counter = 2
      while (existsSync(filePath(id))) {
        id = `te-${data.date}-${taskSlug}-${counter}`
        counter++
      }

      const entry: TimeEntry = {
        ...data,
        id,
        type: 'time-entry',
        hours_rounded: hours,
        created: today,
      }
      return { entry, path: filePath(id), body }
    },
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  }).pipe(
    E.flatMap(({ entry, path, body: b }) =>
      E.map(
        writeEntity(path, entry as unknown as Record<string, unknown>, b),
        () => entry
      )
    )
  )
}

/**
 * Updates an existing time entry with a partial patch.
 */
export function updateTimeEntry(
  id: string,
  patch: Partial<TimeEntry>
): E.Effect<TimeEntry, DataError> {
  return E.flatMap(getTimeEntry(id), ({ data, body }) => {
    const updated: TimeEntry = {
      ...data,
      ...patch,
      updated: new Date().toISOString().split('T')[0],
    }
    return E.map(
      writeEntity(filePath(id), updated as unknown as Record<string, unknown>, body),
      () => updated
    )
  })
}

/**
 * Deletes a time entry file.
 */
export function deleteTimeEntry(id: string): E.Effect<void, DataError> {
  return E.tryPromise({
    try: async () => {
      const { unlink } = await import('node:fs/promises')
      await unlink(filePath(id))
    },
    catch: (e) => new ParseError({ file: filePath(id), cause: e }),
  })
}
