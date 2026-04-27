import { existsSync } from 'node:fs'
import { Effect as E } from 'effect'
import type { DataError } from './errors.js'
import { FileNotFoundError, ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType } from '$lib/server/index-db.js'
import type { EntityWithBody, Organization } from './types.js'

const dir = () => dataPath('CRM', 'organizations')
const filePath = (id: string) => `${dir()}/${id}.md`

/**
 * Lists all organizations from the SQLite index.
 * @returns Effect resolving to an array of Organization objects, or failing with DataError.
 */
export function listOrganizations(): E.Effect<Organization[], DataError> {
  return E.try({
    try: () => listByType<Organization>('organization'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}

/**
 * Retrieves a single organization by ID, including its markdown body.
 * @param id - Organization identifier, e.g. "org-acme-corp".
 * @returns Effect resolving to the organization data and markdown body, or failing with DataError.
 */
export function getOrganization(id: string): E.Effect<EntityWithBody<Organization>, DataError> {
  return requireEntity<Organization>(filePath(id), id)
}

/**
 * Updates an existing organization with the provided partial data.
 * Preserves fields not included in the patch. Replaces the markdown body if provided.
 * @param id - Organization identifier to update.
 * @param patch - Partial Organization fields to apply.
 * @param body - Optional replacement markdown body; keeps existing body if omitted.
 * @returns Effect resolving to the updated Organization, or failing with DataError.
 */
export function updateOrganization(
  id: string,
  patch: Partial<Organization>,
  body?: string
): E.Effect<Organization, DataError> {
  return E.flatMap(getOrganization(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch }
    return E.map(
      writeEntity(filePath(id), updated as Record<string, unknown>, body ?? existingBody),
      () => updated
    )
  })
}

/**
 * Creates a new organization. The ID is auto-generated from the organization name
 * (lowercased, spaces converted to dashes, non-alphanumeric characters stripped).
 * @param data - Organization fields excluding id, type, and created (auto-assigned).
 * @param body - Optional initial markdown body content.
 * @returns Effect resolving to the created Organization, or failing with DataError if the ID already exists.
 */
export function createOrganization(
  data: Omit<Organization, 'id' | 'type' | 'created'>,
  body = ''
): E.Effect<Organization, DataError> {
  const id = `org-${data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
  const org: Organization = {
    ...data,
    id,
    type: 'organization',
    created: new Date().toISOString().split('T')[0]
  }
  if (existsSync(filePath(id))) {
    return E.fail(new FileNotFoundError({ id: 'conflict' }))
  }
  return E.map(
    writeEntity(filePath(id), org as unknown as Record<string, unknown>, body),
    () => org
  )
}
