import type { Handle } from '@sveltejs/kit'
import { registerWriteHook } from '$lib/data/parser.js'
import { domainFromPath, getDb, upsertEntityInDb } from '$lib/server/index-db.js'
import { syncEngine } from '$lib/server/sync-engine.js'

registerWriteHook((filePath, data, body) => {
  if (!data.id || !data.type) return
  try {
    const db = getDb()
    const domain = domainFromPath(filePath)
    upsertEntityInDb(db, String(data.id), String(data.type), domain, filePath, data, body)
  } catch {
    // best effort — watcher will pick it up
  }
})

syncEngine.start()

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event)
}
