import { json, error } from '@sveltejs/kit'
import { readTelosFile, telosPath } from '$lib/server/telos.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ url }) => {
  const file = url.searchParams.get('file')
  if (!file) error(400, 'Missing file param')

  try {
    telosPath(file)
  } catch {
    error(400, 'Invalid file path')
  }

  try {
    const content = readTelosFile(file)
    return json({ file, content })
  } catch {
    error(404, 'File not found')
  }
}
