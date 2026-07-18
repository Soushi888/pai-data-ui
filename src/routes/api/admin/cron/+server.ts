import { json, error } from '@sveltejs/kit'
import { spawnSync } from 'node:child_process'
import type { RequestHandler } from './$types'

const HERMES_BIN = process.env.HERMES_BIN ?? 'hermes'

interface HermesCronJob {
  id: string
  name: string
  schedule: string
  status: 'active' | 'paused'
  repeat: string
  nextRun: string | null
  deliver: string
  prompt: string
  script: string | null
  skills: string[]
  workdir: string | null
  noAgent: boolean
}

function runHermesCron(args: string[]): { stdout: string; stderr: string; code: number } {
  const proc = spawnSync(HERMES_BIN, ['cron', ...args], {
    encoding: 'utf-8',
    timeout: 30_000,
  })
  return { stdout: proc.stdout, stderr: proc.stderr, code: proc.status ?? 1 }
}

function parseListOutput(output: string): HermesCronJob[] {
  const jobs: HermesCronJob[] = []
  const blocks = output.split(/\n\s*\n/).filter((b) => b.trim() && !b.includes('──'))

  for (const block of blocks) {
    const idMatch = block.match(/^\s+([a-f0-9]+)\s+\[(\w+)\]/)
    if (!idMatch) continue

    const id = idMatch[1]
    const status = idMatch[2] as 'active' | 'paused'
    const name = extractField(block, 'Name')
    const schedule = extractField(block, 'Schedule')
    const repeat = extractField(block, 'Repeat') ?? '∞'
    const nextRun = extractField(block, 'Next run')
    const deliver = extractField(block, 'Deliver') ?? 'local'
    const prompt = extractField(block, 'Prompt') ?? ''
    const script = extractField(block, 'Script') ?? null
    const skills = extractField(block, 'Skills')?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
    const workdir = extractField(block, 'Workdir') ?? null
    const noAgent = extractField(block, 'No agent') === 'True'

    jobs.push({
      id,
      name: name ?? id,
      schedule: schedule ?? '* * * * *',
      status,
      repeat: repeat ?? '∞',
      nextRun: nextRun ?? null,
      deliver: deliver ?? 'local',
      prompt,
      script,
      skills,
      workdir,
      noAgent,
    })
  }

  return jobs
}

function extractField(block: string, field: string): string | null {
  const re = new RegExp(`^\\s{4}${field}:\\s+(.+)$`, 'm')
  const m = block.match(re)
  return m ? m[1].trim() : null
}

export const GET: RequestHandler = async () => {
  const { stdout, stderr, code } = runHermesCron(['list', '--all'])
  if (code !== 0) {
    return json({ jobs: [], error: stderr.trim() || 'Command failed' })
  }
  const jobs = parseListOutput(stdout)
  return json({ jobs })
}

export const POST: RequestHandler = async ({ request }) => {
  let body: {
    schedule: string
    prompt?: string
    name?: string
    deliver?: string
    repeat?: number
    skill?: string[]
    script?: string
    noAgent?: boolean
    workdir?: string
  }
  try {
    body = await request.json()
  } catch {
    error(400, 'Invalid JSON body')
  }

  if (!body.schedule) error(400, 'Missing schedule')

  const args: string[] = [body.schedule]
  if (body.prompt) args.push(body.prompt)
  if (body.name) args.push('--name', body.name)
  if (body.deliver) args.push('--deliver', body.deliver)
  if (body.repeat !== undefined) args.push('--repeat', String(body.repeat))
  if (body.skill) {
    for (const s of body.skill) args.push('--skill', s)
  }
  if (body.script) args.push('--script', body.script)
  if (body.noAgent) args.push('--no-agent')
  if (body.workdir) args.push('--workdir', body.workdir)

  const { stdout, stderr, code } = runHermesCron(['create', ...args])
  if (code !== 0) {
    return json({ ok: false, error: stderr.trim() || 'Create failed' }, { status: 500 })
  }

  // Parse the created job ID from output like "Created job: abc123"
  const idMatch = stdout.match(/Created job:\s+([a-f0-9]+)/)
  const id = idMatch ? idMatch[1] : null

  return json({ ok: true, id, message: stdout.trim() })
}