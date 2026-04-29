import { json } from '@sveltejs/kit'
import { getDb } from '$lib/server/index-db.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = () => {
  const contributions = getDb()
    .prepare('SELECT * FROM vf_agent_contributions ORDER BY total_qty DESC')
    .all()
  const claims = getDb()
    .prepare('SELECT * FROM vf_claim_status')
    .all()
  return json({ contributions, claims })
}
