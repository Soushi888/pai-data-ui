import { dataPath, readRaw, writeRaw } from '$lib/data/parser.js'
import { error } from '@sveltejs/kit'
import { Effect } from 'effect'
import type { PageServerLoad } from './$types.js'

const filePath = (id: string) => `${dataPath('CRM', 'organizations')}/${id}.md`

export const load: PageServerLoad = async ({ params }) => {
  const result = await Effect.runPromise(Effect.either(readRaw(filePath(params.id))))
  if (result._tag === 'Left') throw error(404, 'Organization not found')
  return { content: result.right, id: params.id }
}
