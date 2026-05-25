import { Effect as E } from 'effect'
import { error } from '@sveltejs/kit'
import { getTimeEntry } from '$lib/data/time-entries.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const result = await E.runPromise(E.either(getTimeEntry(params.id)))
  if (result._tag === 'Left') error(404, 'Time entry not found')
  return { entry: result.right.data, body: result.right.body }
}
