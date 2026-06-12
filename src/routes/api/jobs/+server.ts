import { json } from '@sveltejs/kit'
import { getJobsWithState } from '$lib/server/cron.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  return json({ jobs: getJobsWithState() })
}
