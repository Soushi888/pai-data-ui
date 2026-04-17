import { Effect } from 'effect'
import { listProjects } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const [tasksR, projectsR] = await Promise.all([
    Effect.runPromise(Effect.either(listTasks())),
    Effect.runPromise(Effect.either(listProjects()))
  ])

  const tasks = tasksR._tag === 'Right' ? tasksR.right : []
  const projectNames: Record<string, string> = {}
  if (projectsR._tag === 'Right') {
    for (const p of projectsR.right) projectNames[p.id] = p.title
  }

  return { tasks, projectNames }
}
