import { Effect } from 'effect'
import { getOpportunity } from '$lib/data/opportunities.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
  const from = url.searchParams.get('from')
  if (!from) return { prefill: null }

  const result = await Effect.runPromise(Effect.either(getOpportunity(from)))
  if (result._tag === 'Left') return { prefill: null }

  const opp = result.right.data
  return {
    prefill: {
      title: opp.title,
      organization: opp.organization,
      opportunity_ref: opp.id
    }
  }
}
