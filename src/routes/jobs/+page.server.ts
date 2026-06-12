import { getJobsWithState } from '$lib/server/cron.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  return { jobs: getJobsWithState() }
}
