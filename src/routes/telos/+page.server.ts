import { redirect } from '@sveltejs/kit'
import { listTelosFiles } from '$lib/server/telos.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => {
  const files = listTelosFiles()
  const first = files.find((f) => f.exists)
  if (first) {
    const encoded = encodeURIComponent(first.file.replace('.md', ''))
    redirect(302, `/telos/${encoded}`)
  }
  return { files }
}
