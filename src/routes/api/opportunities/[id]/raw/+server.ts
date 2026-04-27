import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { dataPath, writeRaw } from '$lib/data/parser.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

const filePath = (id: string) => `${dataPath('CRM', 'opportunities')}/${id}.md`

export const POST: RequestHandler = async ({ params, request }) => {
  const { content } = await request.json()
  const result = await E.runPromise(E.either(writeRaw(filePath(params.id), content)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ success: true })
}
