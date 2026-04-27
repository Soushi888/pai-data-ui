import { error } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { getProject } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const [projectR, tasksR] = await Promise.all([
    E.runPromise(E.either(getProject(params.id))),
    E.runPromise(E.either(listTasks()))
  ])

  if (projectR._tag === 'Left') throw error(404, 'Project not found')

  const tasks = tasksR._tag === 'Right'
    ? tasksR.right.filter((t) => t.project_id === params.id)
    : []

  return { project: projectR.right.data, body: projectR.right.body, tasks }
}
