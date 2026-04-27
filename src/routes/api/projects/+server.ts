import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { createProject, listProjects } from '$lib/data/projects.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status')
  const project_type = url.searchParams.get('project_type')

  const result = await E.runPromise(E.either(listProjects()))
  if (result._tag === 'Left') return errorResponse(result.left)

  let projects = result.right
  if (status) projects = projects.filter((p) => p.status === status)
  if (project_type) projects = projects.filter((p) => p.project_type === project_type)

  return json({ projects, total: projects.length })
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const result = await E.runPromise(E.either(createProject(body)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ project: result.right }, { status: 201 })
}
