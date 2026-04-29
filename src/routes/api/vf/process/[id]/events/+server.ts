import { json } from '@sveltejs/kit'
import { getDb } from '$lib/server/index-db.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ params }) => {
  const rows = getDb()
    .prepare('SELECT * FROM vf_process_flows WHERE process_id = ? ORDER BY point_in_time ASC')
    .all(params.id)
  return json({ events: rows, process_id: params.id, total: rows.length })
}
