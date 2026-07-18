import { json } from '@sveltejs/kit'
import { spawnSync } from 'node:child_process'
import type { RequestHandler } from './$types'

const HERMES_BIN = process.env.HERMES_BIN ?? 'hermes'

function runHermesCron(args: string[]): { stdout: string; stderr: string; code: number } {
  const proc = spawnSync(HERMES_BIN, ['cron', ...args], {
    encoding: 'utf-8',
    timeout: 30_000,
  })
  return { stdout: proc.stdout, stderr: proc.stderr, code: proc.status ?? 1 }
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  const { id } = params
  let body: { action?: 'pause' | 'resume'; schedule?: string; name?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.action === 'pause') {
    const { stderr, code } = runHermesCron(['pause', id])
    if (code !== 0) return json({ error: stderr.trim() }, { status: 500 })
    return json({ ok: true })
  }

  if (body.action === 'resume') {
    const { stderr, code } = runHermesCron(['resume', id])
    if (code !== 0) return json({ error: stderr.trim() }, { status: 500 })
    return json({ ok: true })
  }

  return json({ error: 'Unsupported action' }, { status: 400 })
}

export const DELETE: RequestHandler = async ({ params }) => {
  const { id } = params
  const { stdout, stderr, code } = runHermesCron(['remove', id])
  if (code !== 0) return json({ error: stderr.trim() }, { status: 500 })
  return json({ ok: true, message: stdout.trim() })
}

export const POST: RequestHandler = async ({ params }) => {
  const { id } = params
  const { stdout, stderr, code } = runHermesCron(['run', id])
  if (code !== 0) return json({ error: stderr.trim() }, { status: 500 })
  return json({ ok: true, message: stdout.trim() })
}