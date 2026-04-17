import { error } from '@sveltejs/kit'
import { Effect } from 'effect'
import { getProject } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const [projectR, tasksR] = await Promise.all([
    Effect.runPromise(Effect.either(getProject(params.id))),
    Effect.runPromise(Effect.either(listTasks()))
  ])

  if (projectR._tag === 'Left') throw error(404, 'Project not found')

  const tasks = tasksR._tag === 'Right'
    ? tasksR.right.filter((t) => t.project_id === params.id)
    : []

  return { project: projectR.right.data, body: projectR.right.body, tasks }
}
