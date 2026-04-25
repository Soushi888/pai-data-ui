import { existsSync } from 'node:fs'
import { Effect } from 'effect'
import type { DataError } from './errors.js'
import { FileNotFoundError, ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType } from '$lib/server/index-db.js'
import type { EntityWithBody, Organization } from './types.js'

const dir = () => dataPath('CRM', 'organizations')
const filePath = (id: string) => `${dir()}/${id}.md`

export function listOrganizations(): Effect.Effect<Organization[], DataError> {
  return Effect.try({
    try: () => listByType<Organization>('organization'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}

export function getOrganization(id: string): Effect.Effect<EntityWithBody<Organization>, DataError> {
  return requireEntity<Organization>(filePath(id), id)
}

export function updateOrganization(
  id: string,
  patch: Partial<Organization>,
  body?: string
): Effect.Effect<Organization, DataError> {
  return Effect.flatMap(getOrganization(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch }
    return Effect.map(
      writeEntity(filePath(id), updated as Record<string, unknown>, body ?? existingBody),
      () => updated
    )
  })
}

export function createOrganization(
  data: Omit<Organization, 'id' | 'type' | 'created'>,
  body = ''
): Effect.Effect<Organization, DataError> {
  const id = `org-${data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
  const org: Organization = {
    ...data,
    id,
    type: 'organization',
    created: new Date().toISOString().split('T')[0]
  }
  if (existsSync(filePath(id))) {
    return Effect.fail(new FileNotFoundError({ id: 'conflict' }))
  }
  return Effect.map(
    writeEntity(filePath(id), org as unknown as Record<string, unknown>, body),
    () => org
  )
}
