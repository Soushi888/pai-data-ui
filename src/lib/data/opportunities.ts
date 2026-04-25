import { Effect } from 'effect'
import type { DataError } from './errors.js'
import { ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType } from '$lib/server/index-db.js'
import type { EntityWithBody, Opportunity } from './types.js'

const dir = () => dataPath('CRM', 'opportunities')
const filePath = (id: string) => `${dir()}/${id}.md`

export function listOpportunities(): Effect.Effect<Opportunity[], DataError> {
  return Effect.try({
    try: () => listByType<Opportunity>('opportunity'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}

export function getOpportunity(id: string): Effect.Effect<EntityWithBody<Opportunity>, DataError> {
  return requireEntity<Opportunity>(filePath(id), id)
}

export function updateOpportunity(
  id: string,
  patch: Partial<Opportunity>,
  body?: string
): Effect.Effect<Opportunity, DataError> {
  return Effect.flatMap(getOpportunity(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch, updated: new Date().toISOString().split('T')[0] }
    return Effect.map(
      writeEntity(filePath(id), updated as unknown as Record<string, unknown>, body ?? existingBody),
      () => updated
    )
  })
}

export function createOpportunity(
  data: Omit<Opportunity, 'id' | 'type' | 'created' | 'updated'>,
  body = ''
): Effect.Effect<Opportunity, DataError> {
  const today = new Date().toISOString().split('T')[0]
  const id = `opp-${data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)}`
  const opp: Opportunity = { ...data, id, type: 'opportunity', created: today, updated: today }
  return Effect.map(writeEntity(filePath(id), opp as unknown as Record<string, unknown>, body), () => opp)
}
