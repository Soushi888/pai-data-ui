import { json } from '@sveltejs/kit'
import { Effect } from 'effect'
import { createOrganization, listOrganizations } from '$lib/data/organizations.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status')
  const tag = url.searchParams.get('tag')

  const result = await Effect.runPromise(Effect.either(listOrganizations()))
  if (result._tag === 'Left') return errorResponse(result.left)

  let orgs = result.right
  if (status) orgs = orgs.filter((o) => o.status === status)
  if (tag) orgs = orgs.filter((o) => o.tags.includes(tag))

  return json({ organizations: orgs, total: orgs.length })
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const result = await Effect.runPromise(Effect.either(createOrganization(body)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ organization: result.right }, { status: 201 })
}
