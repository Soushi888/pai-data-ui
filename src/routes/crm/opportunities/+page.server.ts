import { Effect as E } from 'effect'
import { listOpportunities } from '$lib/data/opportunities.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const result = await E.runPromise(E.either(listOpportunities()))
  const opportunities = result._tag === 'Right' ? result.right : []
  return { opportunities }
}
