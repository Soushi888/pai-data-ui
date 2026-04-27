import { Effect as E } from 'effect'
import type { DataError } from './errors.js'
import { ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType } from '$lib/server/index-db.js'
import type { EntityWithBody, Opportunity } from './types.js'

const dir = () => dataPath('CRM', 'opportunities')
const filePath = (id: string) => `${dir()}/${id}.md`

/**
 * Lists all opportunities from the SQLite index.
 * @returns Effect resolving to an array of Opportunity objects, or failing with DataError.
 */
export function listOpportunities(): E.Effect<Opportunity[], DataError> {
  return E.try({
    try: () => listByType<Opportunity>('opportunity'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}

/**
 * Retrieves a single opportunity by ID, including its markdown body.
 * @param id - Opportunity identifier, e.g. "opp-client-website-redesign".
 * @returns Effect resolving to the opportunity data and markdown body, or failing with DataError.
 */
export function getOpportunity(id: string): E.Effect<EntityWithBody<Opportunity>, DataError> {
  return requireEntity<Opportunity>(filePath(id), id)
}

/**
 * Updates an existing opportunity with the provided partial data.
 * Preserves fields not included in the patch. Always updates the `updated` timestamp.
 * Replaces the markdown body if provided.
 * @param id - Opportunity identifier to update.
 * @param patch - Partial Opportunity fields to apply.
 * @param body - Optional replacement markdown body; keeps existing body if omitted.
 * @returns Effect resolving to the updated Opportunity, or failing with DataError.
 */
export function updateOpportunity(
  id: string,
  patch: Partial<Opportunity>,
  body?: string
): E.Effect<Opportunity, DataError> {
  return E.flatMap(getOpportunity(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch, updated: new Date().toISOString().split('T')[0] }
    return E.map(
      writeEntity(filePath(id), updated as unknown as Record<string, unknown>, body ?? existingBody),
      () => updated
    )
  })
}

/**
 * Creates a new opportunity. The ID is auto-generated from the opportunity title
 * (lowercased, spaces converted to dashes, non-alphanumeric characters stripped, truncated to 40 chars).
 * @param data - Opportunity fields excluding id, type, created, and updated (auto-assigned).
 * @param body - Optional initial markdown body content.
 * @returns Effect resolving to the created Opportunity, or failing with DataError.
 */
export function createOpportunity(
  data: Omit<Opportunity, 'id' | 'type' | 'created' | 'updated'>,
  body = ''
): E.Effect<Opportunity, DataError> {
  const today = new Date().toISOString().split('T')[0]
  const id = `opp-${data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)}`
  const opp: Opportunity = { ...data, id, type: 'opportunity', created: today, updated: today }
  return E.map(writeEntity(filePath(id), opp as unknown as Record<string, unknown>, body), () => opp)
}
