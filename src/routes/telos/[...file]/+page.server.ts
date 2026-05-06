import { error } from '@sveltejs/kit'
import { listTelosFiles, readTelosFile, telosPath } from '$lib/server/telos.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ params }) => {
  const file = decodeURIComponent(params.file) + '.md'

  try {
    telosPath(file)
  } catch {
    error(400, 'Invalid file path')
  }

  let content = ''
  try {
    content = readTelosFile(file)
  } catch {
    error(404, `TELOS file not found: ${file}`)
  }

  const files = listTelosFiles()
  return { file, content, files }
}
