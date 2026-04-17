import { json } from '@sveltejs/kit'
import { Effect } from 'effect'
import { createTask, listTasks } from '$lib/data/tasks.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const project_id = url.searchParams.get('project_id')
  const status = url.searchParams.get('status')

  const result = await Effect.runPromise(Effect.either(listTasks()))
  if (result._tag === 'Left') return errorResponse(result.left)

  let tasks = result.right
  if (project_id) tasks = tasks.filter((t) => t.project_id === project_id)
  if (status) tasks = tasks.filter((t) => t.status === status)

  return json({ tasks, total: tasks.length })
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const result = await Effect.runPromise(Effect.either(createTask(body)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ task: result.right }, { status: 201 })
}
