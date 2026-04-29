import { json } from '@sveltejs/kit'
import { getDb } from '$lib/server/index-db.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ url }) => {
  const type = url.searchParams.get('type')
  let query = 'SELECT * FROM vf_economic_events'
  const params: unknown[] = []
  if (type) {
    query += ' WHERE type = ?'
    params.push(type)
  }
  query += ' ORDER BY point_in_time DESC'
  const rows = getDb().prepare(query).all(...params)
  return json({ events: rows, total: rows.length })
}
