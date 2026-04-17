import { Effect } from 'effect'
import type { DataError } from './errors.js'
import { dataPath, listDir, readEntity, requireEntity, writeEntity } from './parser.js'
import type { EntityWithBody, Organization } from './types.js'

const dir = () => dataPath('CRM', 'organizations')
const filePath = (id: string) => `${dir()}/${id}.md`

export function listOrganizations(): Effect.Effect<Organization[], DataError> {
  return Effect.flatMap(listDir(dir()), (paths) =>
    Effect.all(
      paths.map((p) => Effect.map(readEntity<Organization>(p), (e) => e.data)),
      { concurrency: 10 }
    )
  )
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
