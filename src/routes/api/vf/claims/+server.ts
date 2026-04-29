import { json } from '@sveltejs/kit'
import { getDb } from '$lib/server/index-db.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ url }) => {
  const status = url.searchParams.get('status')
  let query = 'SELECT * FROM vf_claim_status'
  const params: unknown[] = []
  if (status) {
    query += ' WHERE settlement_status = ?'
    params.push(status)
  }
  const rows = getDb().prepare(query).all(...params)
  return json({ claims: rows, total: rows.length })
}
