import { Effect as E } from 'effect'
import { listContacts } from '$lib/data/contacts.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const result = await E.runPromise(E.either(listContacts()))
  const contacts = result._tag === 'Right' ? result.right : []
  const allTags = [...new Set(contacts.flatMap((c) => c.tags ?? []))].sort()
  contacts.sort((a, b) => (b.last_contact ?? '').localeCompare(a.last_contact ?? ''))
  return { contacts, allTags }
}
