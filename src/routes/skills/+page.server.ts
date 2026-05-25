import { loadSkillGraph } from '$lib/server/skills.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => {
  return { graph: loadSkillGraph() }
}
