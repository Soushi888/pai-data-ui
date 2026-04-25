import { json } from '@sveltejs/kit'
import { getDb } from '$lib/server/index-db.js'
import { rebuildIndex } from '$lib/server/sync-engine.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = () => {
  const db = getDb()

  const entity_count = (
    db.prepare('SELECT COUNT(*) as n FROM entities').get() as { n: number }
  ).n

  const by_type = db
    .prepare('SELECT type, COUNT(*) as n FROM entities GROUP BY type ORDER BY n DESC')
    .all() as { type: string; n: number }[]

  const errors = db
    .prepare(
      `SELECT file_path, error_type, error_msg, occurred_at
       FROM sync_errors WHERE resolved_at IS NULL ORDER BY occurred_at DESC LIMIT 50`
    )
    .all()

  const last_error = (
    db
      .prepare('SELECT MAX(indexed_at) as t FROM entities')
      .get() as { t: number | null }
  ).t

  return json({
    entity_count,
    by_type,
    errors,
    last_indexed: last_error ? new Date(last_error * 1000).toISOString() : null,
  })
}

export const POST: RequestHandler = () => {
  const result = rebuildIndex()
  return json({ ...result, message: 'Index rebuilt successfully' })
}
