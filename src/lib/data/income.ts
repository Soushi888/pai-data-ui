import { existsSync } from 'node:fs'
import { Effect as E } from 'effect'
import type { DataError } from './errors.js'
import { FileNotFoundError, ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType } from '$lib/server/index-db.js'
import type { AdHocIncome, EntityWithBody } from './types.js'

const dir = () => dataPath('ERP', 'income')
const filePath = (id: string) => `${dir()}/${id}.md`

/**
 * Lists all income records from the SQLite index.
 * @returns Effect resolving to AdHocIncome[], or failing with DataError.
 */
export function listIncome(): E.Effect<AdHocIncome[], DataError> {
  return E.try({
    try: () => listByType<AdHocIncome>('income'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}

/**
 * Retrieves a single income record by ID with its markdown body.
 * @param id - Income identifier.
 * @returns Effect resolving to entity data and markdown body, or failing with DataError.
 */
export function getIncome(id: string): E.Effect<EntityWithBody<AdHocIncome>, DataError> {
  return requireEntity<AdHocIncome>(filePath(id), id)
}

/**
 * Creates a new income record. Income records are immutable after creation.
 * @param data - Income fields to set.
 * @param body - Optional initial markdown body.
 * @returns Effect resolving to the created AdHocIncome, or failing with DataError.
 */
export function createIncome(
  data: Omit<AdHocIncome, 'id' | 'type' | 'created'>,
  body = ''
): E.Effect<AdHocIncome, DataError> {
  const year = data.date.slice(0, 4)
  const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const id = `inc-${slug}-${year}`
  if (existsSync(filePath(id))) {
    return E.fail(new FileNotFoundError({ id: 'conflict' }))
  }
  const income: AdHocIncome = {
    ...data,
    id,
    type: 'income',
    created: new Date().toISOString().split('T')[0]
  }
  return E.map(
    writeEntity(filePath(id), income as unknown as Record<string, unknown>, body),
    () => income
  )
}
