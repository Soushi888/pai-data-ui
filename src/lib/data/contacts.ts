import { existsSync } from 'node:fs'
import { Effect } from 'effect'
import type { DataError } from './errors.js'
import { FileNotFoundError } from './errors.js'
import { dataPath, listDir, readEntity, requireEntity, writeEntity } from './parser.js'
import type { Contact, EntityWithBody } from './types.js'

const dir = () => dataPath('CRM', 'contacts')
const filePath = (id: string) => `${dir()}/${id}.md`

export function listContacts(): Effect.Effect<Contact[], DataError> {
  return Effect.flatMap(listDir(dir()), (paths) =>
    Effect.all(
      paths.map((p) => Effect.map(readEntity<Contact>(p), (e) => e.data)),
      { concurrency: 10 }
    )
  )
}

export function getContact(id: string): Effect.Effect<EntityWithBody<Contact>, DataError> {
  return requireEntity<Contact>(filePath(id), id)
}

export function updateContact(
  id: string,
  patch: Partial<Contact>,
  body?: string
): Effect.Effect<Contact, DataError> {
  return Effect.flatMap(getContact(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch }
    return Effect.map(
      writeEntity(filePath(id), updated as unknown as Record<string, unknown>, body ?? existingBody),
      () => updated
    )
  })
}

export function createContact(
  data: Omit<Contact, 'id' | 'type' | 'created'>,
  body = ''
): Effect.Effect<Contact, DataError> {
  const id = `contact-${data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
  const contact: Contact = {
    ...data,
    id,
    type: 'contact',
    created: new Date().toISOString().split('T')[0]
  }
  if (existsSync(filePath(id))) {
    return Effect.fail(new FileNotFoundError({ id: 'conflict' }))
  }
  return Effect.map(
    writeEntity(filePath(id), contact as unknown as Record<string, unknown>, body),
    () => contact
  )
}
