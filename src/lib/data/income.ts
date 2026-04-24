import { existsSync } from 'node:fs'
import { Effect } from 'effect'
import type { DataError } from './errors.js'
import { FileNotFoundError } from './errors.js'
import { dataPath, listDir, readEntity, requireEntity, writeEntity } from './parser.js'
import type { AdHocIncome, EntityWithBody } from './types.js'

const dir = () => dataPath('ERP', 'income')
const filePath = (id: string) => `${dir()}/${id}.md`

export function listIncome(): Effect.Effect<AdHocIncome[], DataError> {
  return Effect.flatMap(listDir(dir()), (paths) =>
    Effect.all(
      paths.map((p) => Effect.map(readEntity<AdHocIncome>(p), (e) => e.data)),
      { concurrency: 10 }
    )
  )
}

export function getIncome(id: string): Effect.Effect<EntityWithBody<AdHocIncome>, DataError> {
  return requireEntity<AdHocIncome>(filePath(id), id)
}

export function createIncome(
  data: Omit<AdHocIncome, 'id' | 'type' | 'created'>,
  body = ''
): Effect.Effect<AdHocIncome, DataError> {
  const year = data.date.slice(0, 4)
  const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const id = `inc-${slug}-${year}`
  if (existsSync(filePath(id))) {
    return Effect.fail(new FileNotFoundError({ id: 'conflict' }))
  }
  const income: AdHocIncome = {
    ...data,
    id,
    type: 'income',
    created: new Date().toISOString().split('T')[0]
  }
  return Effect.map(
    writeEntity(filePath(id), income as unknown as Record<string, unknown>, body),
    () => income
  )
}
