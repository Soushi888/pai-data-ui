import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { createTimeEntry } from '$lib/data/time-entries.js'
import { queryTimeEntries } from '$lib/server/index-db.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const opts = {
    taskId: url.searchParams.get('taskId') ?? undefined,
    projectId: url.searchParams.get('projectId') ?? undefined,
    category: url.searchParams.get('category') ?? undefined,
    dateFrom: url.searchParams.get('dateFrom') ?? undefined,
    dateTo: url.searchParams.get('dateTo') ?? undefined,
    limit: url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : undefined,
  }
  const entries = queryTimeEntries(opts)
  return json({ entries, total: entries.length })
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  if (!body.date || !body.minutes || !body.description || !body.project_id) {
    return json({ error: 'date, minutes, description, project_id required' }, { status: 400 })
  }
  const result = await E.runPromise(E.either(createTimeEntry(body)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ entry: result.right }, { status: 201 })
}
