import { json, error } from '@sveltejs/kit'
import { existsSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { RequestHandler } from './$types'

const HERMES_DIR = process.env.HERMES_DIR ?? process.env.PAI_DIR ?? join(process.env.HOME ?? '~', '.hermes')
const VOICE_MUTED_FILE = join(HERMES_DIR, 'MEMORY/STATE/voice-muted')

function isMuted() { return existsSync(VOICE_MUTED_FILE) }
function mute() { writeFileSync(VOICE_MUTED_FILE, '') }
function unmute() { if (isMuted()) unlinkSync(VOICE_MUTED_FILE) }

export const GET: RequestHandler = async () => json({ muted: isMuted() })

export const POST: RequestHandler = async ({ url }) => {
  const action = url.searchParams.get('action') ?? 'toggle'
  if (action === 'mute') { mute(); return json({ muted: true }) }
  if (action === 'unmute') { unmute(); return json({ muted: false }) }
  if (action === 'toggle') { isMuted() ? unmute() : mute(); return json({ muted: isMuted() }) }
  throw error(400, 'unknown action')
}
