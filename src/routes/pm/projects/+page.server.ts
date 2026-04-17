import { Effect } from 'effect'
import { listProjects } from '$lib/data/projects.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const result = await Effect.runPromise(Effect.either(listProjects()))
  const projects = result._tag === 'Right' ? result.right : []
  projects.sort((a, b) => b.updated.localeCompare(a.updated))
  return { projects }
}
