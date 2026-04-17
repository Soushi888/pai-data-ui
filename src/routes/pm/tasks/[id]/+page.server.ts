import { error } from '@sveltejs/kit'
import { Effect } from 'effect'
import { getProject } from '$lib/data/projects.js'
import { getTask } from '$lib/data/tasks.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const result = await Effect.runPromise(Effect.either(getTask(params.id)))
  if (result._tag === 'Left') throw error(404, 'Task not found')

  const task = result.right.data
  const body = result.right.body

  const projectResult = await Effect.runPromise(Effect.either(getProject(task.project_id)))
  const projectTitle = projectResult._tag === 'Right' ? projectResult.right.data.title : task.project_id

  return { task, body, projectTitle }
}
