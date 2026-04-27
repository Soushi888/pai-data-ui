import { error } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { getContact } from '$lib/data/contacts.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const result = await E.runPromise(E.either(getContact(params.id)))
  if (result._tag === 'Left') throw error(404, 'Contact not found')
  return { contact: result.right.data, body: result.right.body }
}
