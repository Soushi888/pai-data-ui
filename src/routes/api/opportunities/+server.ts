import { json } from '@sveltejs/kit'
import { Effect } from 'effect'
import { createOpportunity, listOpportunities } from '$lib/data/opportunities.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status')
  const contact = url.searchParams.get('contact')

  const result = await Effect.runPromise(Effect.either(listOpportunities()))
  if (result._tag === 'Left') return errorResponse(result.left)

  let opps = result.right
  if (status) opps = opps.filter((o) => o.status === status)
  if (contact) opps = opps.filter((o) => o.contact === contact)

  return json({ opportunities: opps, total: opps.length })
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const result = await Effect.runPromise(Effect.either(createOpportunity(body)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ opportunity: result.right }, { status: 201 })
}
