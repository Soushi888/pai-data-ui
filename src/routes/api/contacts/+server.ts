import { json } from '@sveltejs/kit'
import { Effect } from 'effect'
import { createContact, listContacts } from '$lib/data/contacts.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status')
  const tag = url.searchParams.get('tag')
  const q = url.searchParams.get('q')?.toLowerCase()

  const result = await Effect.runPromise(Effect.either(listContacts()))
  if (result._tag === 'Left') return errorResponse(result.left)

  let contacts = result.right
  if (status) contacts = contacts.filter((c) => c.status === status)
  if (tag) contacts = contacts.filter((c) => c.tags.includes(tag))
  if (q) contacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(q) ||
    c.organization.toLowerCase().includes(q) ||
    c.role.toLowerCase().includes(q)
  )

  contacts.sort((a, b) => (b.last_contact ?? '').localeCompare(a.last_contact ?? ''))
  return json({ contacts, total: contacts.length })
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const result = await Effect.runPromise(Effect.either(createContact(body)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ contact: result.right }, { status: 201 })
}
