import { existsSync } from 'node:fs'
import { Effect } from 'effect'
import type { DataError } from './errors.js'
import { FileNotFoundError, ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType } from '$lib/server/index-db.js'
import type { Expense, EntityWithBody } from './types.js'

const dir = () => dataPath('ERP', 'expenses')
const filePath = (id: string) => `${dir()}/${id}.md`

/**
 * Lists all expenses from the SQLite index.
 * @returns Effect resolving to Expense[], or failing with DataError.
 */
export function listExpenses(): Effect.Effect<Expense[], DataError> {
  return Effect.try({
    try: () => listByType<Expense>('expense'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}


/**
 * Retrieves a single expense by ID with its markdown body.
 * @param id - Expense identifier.
 * @returns Effect resolving to entity data and markdown body, or failing with DataError.
 */
export function getExpense(id: string): Effect.Effect<EntityWithBody<Expense>, DataError> {
  return requireEntity<Expense>(filePath(id), id)
}

/**
 * Updates an existing expense with a partial patch.
 * @param id - Expense identifier.
 * @param patch - Fields to update; unspecified fields are preserved.
 * @param body - Optional replacement markdown body.
 * @returns Effect resolving to the updated Expense, or failing with DataError.
 */
export function updateExpense(
  id: string,
  patch: Partial<Expense>,
  body?: string
): Effect.Effect<Expense, DataError> {
  return Effect.flatMap(getExpense(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch, updated: new Date().toISOString().split('T')[0] }
    return Effect.map(
      writeEntity(filePath(id), updated as unknown as Record<string, unknown>, body ?? existingBody),
      () => updated
    )
  })
}

/**
 * Creates a new expense.
 * @param data - Expense fields to set.
 * @param body - Optional initial markdown body.
 * @returns Effect resolving to the created Expense, or failing with DataError.
 */
export function createExpense(
  data: Omit<Expense, 'id' | 'type' | 'created' | 'updated'>,
  body = ''
): Effect.Effect<Expense, DataError> {
  const id = `exp-${data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
  if (existsSync(filePath(id))) {
    return Effect.fail(new FileNotFoundError({ id: 'conflict' }))
  }
  const now = new Date().toISOString().split('T')[0]
  const expense: Expense = {
    ...data,
    id,
    type: 'expense',
    created: now,
    updated: now
  }
  return Effect.map(
    writeEntity(filePath(id), expense as unknown as Record<string, unknown>, body),
    () => expense
  )
}
