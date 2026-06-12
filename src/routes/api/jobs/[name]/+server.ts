import { json, error } from '@sveltejs/kit'
import { triggerJob, toggleJob, updateJob } from '$lib/server/cron.js'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ params, url }) => {
  const action = url.searchParams.get('action')
  const name = params.name

  if (action === 'run') {
    const result = await triggerJob(name)
    if (!result.ok) throw error(404, result.error ?? 'failed')
    return json({ ok: true })
  }

  if (action === 'toggle') {
    const result = toggleJob(name)
    if (!result.ok) throw error(404, result.error ?? 'not found')
    return json({ ok: true, enabled: result.enabled })
  }

  throw error(400, 'unknown action — use ?action=run or ?action=toggle')
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  const body = await request.json()
  const result = updateJob(params.name, body)
  if (!result.ok) throw error(404, result.error ?? 'failed')
  return json({ ok: true })
}
