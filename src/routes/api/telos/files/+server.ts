import { json } from '@sveltejs/kit'
import { listTelosFiles } from '$lib/server/telos.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = () => {
  const files = listTelosFiles()
  return json(files)
}
