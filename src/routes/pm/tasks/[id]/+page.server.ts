import { error } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { getProject } from '$lib/data/projects.js'
import { getTask } from '$lib/data/tasks.js'
import { queryTimeEntries, sumHoursForTask } from '$lib/server/index-db.js'
import type { TimeEntry } from '$lib/data/types.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const result = await E.runPromise(E.either(getTask(params.id)))
  if (result._tag === 'Left') throw error(404, 'Task not found')

  const task = result.right.data
  const body = result.right.body

  const projectResult = await E.runPromise(E.either(getProject(task.project_id)))
  const projectTitle = projectResult._tag === 'Right' ? projectResult.right.data.title : task.project_id

  const timeEntries = queryTimeEntries({ taskId: params.id, limit: 5 }) as unknown as TimeEntry[]
  const totalHours = sumHoursForTask(params.id)

  return { task, body, projectTitle, timeEntries, totalHours }
}
