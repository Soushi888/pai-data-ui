import { error } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { getOpportunity } from '$lib/data/opportunities.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const result = await E.runPromise(E.either(getOpportunity(params.id)))
  if (result._tag === 'Left') throw error(404, 'Opportunity not found')
  return { opp: result.right.data, body: result.right.body }
}
