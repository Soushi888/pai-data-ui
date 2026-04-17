import { Effect } from 'effect'
import { listOrganizations } from '$lib/data/organizations.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const result = await Effect.runPromise(Effect.either(listOrganizations()))
  const organizations = result._tag === 'Right' ? result.right : []
  return { organizations }
}
