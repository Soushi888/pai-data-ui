import { Effect } from 'effect'
import { listOpportunities } from '$lib/data/opportunities.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const result = await Effect.runPromise(Effect.either(listOpportunities()))
  const opportunities = result._tag === 'Right' ? result.right : []
  return { opportunities }
}
