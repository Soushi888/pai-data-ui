import { error } from '@sveltejs/kit'
import { Effect } from 'effect'
import { getOpportunity } from '$lib/data/opportunities.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const result = await Effect.runPromise(Effect.either(getOpportunity(params.id)))
  if (result._tag === 'Left') throw error(404, 'Opportunity not found')
  return { opp: result.right.data, body: result.right.body }
}
