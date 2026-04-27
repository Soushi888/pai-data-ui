import { Effect as E } from 'effect'
import { listProjects } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const [tasksR, projectsR] = await Promise.all([
    E.runPromise(E.either(listTasks())),
    E.runPromise(E.either(listProjects()))
  ])

  const tasks = tasksR._tag === 'Right' ? tasksR.right : []
  const projectNames: Record<string, string> = {}
  if (projectsR._tag === 'Right') {
    for (const p of projectsR.right) projectNames[p.id] = p.title
  }

  return { tasks, projectNames }
}
