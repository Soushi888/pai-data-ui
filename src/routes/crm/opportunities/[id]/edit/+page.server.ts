import { dataPath, readRaw, writeRaw } from '$lib/data/parser.js'
import { error, fail } from '@sveltejs/kit'
import { Effect } from 'effect'
import type { Actions, PageServerLoad } from './$types.js'

const filePath = (id: string) => `${dataPath('CRM', 'opportunities')}/${id}.md`

export const load: PageServerLoad = async ({ params }) => {
  const result = await Effect.runPromise(Effect.either(readRaw(filePath(params.id))))
  if (result._tag === 'Left') throw error(404, 'Opportunity not found')
  return { content: result.right, id: params.id }
}

export const actions: Actions = {
  save: async ({ params, request }) => {
    const data = await request.formData()
    const content = data.get('content') as string
    const result = await Effect.runPromise(Effect.either(writeRaw(filePath(params.id), content)))
    if (result._tag === 'Left') return fail(500, { error: 'Failed to save' })
    return { success: true }
  }
}
