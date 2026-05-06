import { json, error } from '@sveltejs/kit'
import { writeFileSync, readFileSync } from 'node:fs'
import { diffLines } from 'diff'
import { telosPath } from '$lib/server/telos.js'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
  const { file, newContent } = await request.json()
  if (!file) error(400, 'Missing file param')

  let abs: string
  try {
    abs = telosPath(file)
  } catch {
    error(400, 'Invalid file path')
  }

  let oldContent = ''
  try {
    oldContent = readFileSync(abs, 'utf-8')
  } catch {
    // file may not exist yet
  }

  writeFileSync(abs, newContent, 'utf-8')

  const diff = diffLines(oldContent, newContent)
  return json({ diff, file })
}
