import { json } from '@sveltejs/kit'
import { getDb } from '$lib/server/index-db.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ params }) => {
  const rows = getDb()
    .prepare('SELECT * FROM vf_agent_contributions WHERE agent_id = ?')
    .all(params.id)
  return json({ contributions: rows, agent_id: params.id })
}
