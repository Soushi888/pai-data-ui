import { error } from '@sveltejs/kit'
import { Effect } from 'effect'
import { getOrganization } from '$lib/data/organizations.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const result = await Effect.runPromise(Effect.either(getOrganization(params.id)))
  if (result._tag === 'Left') throw error(404, 'Organization not found')
  return { org: result.right.data, body: result.right.body }
}
