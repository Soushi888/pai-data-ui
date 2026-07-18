/**
 * Hermes Cron Engine — reads ~/.hermes/USER/DATA/jobs.toml,
 * ticks every 60s, dispatches output to voice (notify endpoint) or log.
 * Runs inside the SvelteKit Node server process.
 */
import { readFileSync, writeFileSync, watchFile, appendFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { spawn } from 'node:child_process'
import { parse } from 'smol-toml'

const HERMES_DIR = process.env.HERMES_DIR ?? process.env.PAI_DIR ?? join(process.env.HOME ?? '~', '.hermes')
const JOBS_TOML = join(HERMES_DIR, 'USER/DATA/jobs.toml')
const LOG_FILE = join(HERMES_DIR, 'USER/DATA/_cron/logs.log')
const VOICE_URL = `http://localhost:${process.env.PORT ?? '4173'}/notify`
const HERMES_BIN = process.env.HERMES_BIN ?? 'hermes'

export type OutputTarget = 'voice' | 'log'

export interface CronJob {
  name: string
  schedule: string
  type: 'script' | 'hermes'
  command?: string
  prompt?: string
  model?: string
  output: OutputTarget | OutputTarget[]
  enabled: boolean
}

export interface JobState {
  lastRun: string | null
  lastResult: 'ok' | 'error' | null
  lastOutput: string | null
  consecutiveFailures: number
  running: boolean
}

// ── Singleton state ──

let jobs: CronJob[] = []
const state = new Map<string, JobState>()
let tickHandle: ReturnType<typeof setInterval> | null = null
let started = false

// ── TOML loading ──

function loadJobs(): void {
  try {
    const raw = readFileSync(JOBS_TOML, 'utf-8')
    const parsed = parse(raw) as { job?: Record<string, unknown>[] }
    const loaded = (parsed.job ?? []).map((j) => {
      // Normalise type: 'claude' becomes 'hermes' for backward compat with old jobs.toml
      const rawType = String(j.type ?? 'script') as 'script' | 'claude' | 'hermes'
      const type: 'script' | 'hermes' = rawType === 'claude' ? 'hermes' : rawType
      return {
        name: String(j.name),
        schedule: String(j.schedule),
        type,
        command: j.command ? String(j.command) : undefined,
        prompt: j.prompt ? String(j.prompt) : undefined,
        model: j.model ? String(j.model) : 'sonnet',
        output: (j.output ?? 'log') as OutputTarget | OutputTarget[],
        enabled: Boolean(j.enabled ?? true),
      }
    })
    jobs = loaded
    clog(`Loaded ${jobs.length} job(s) from ${JOBS_TOML}`)
  } catch (err) {
    clog(`Failed to load jobs.toml: ${err}`)
  }
}

// ── Cron matching ──

type CronField = { any: true } | { values: number[] }

function parseField(field: string, min: number, max: number): CronField {
  if (field === '*') return { any: true }
  if (field.includes('/')) {
    const [range, stepStr] = field.split('/')
    const step = parseInt(stepStr, 10)
    const values: number[] = []
    let start = min, end = max
    if (range !== '*') { const [s, e] = range.split('-').map(Number); start = s; if (e !== undefined) end = e }
    for (let i = start; i <= end; i += step) values.push(i)
    return { values }
  }
  if (field.includes(',')) return { values: field.split(',').map(Number) }
  if (field.includes('-')) {
    const [s, e] = field.split('-').map(Number)
    const values: number[] = []
    for (let i = s; i <= e; i++) values.push(i)
    return { values }
  }
  return { values: [parseInt(field, 10)] }
}

function matchesCron(expr: string, date: Date): boolean {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return false
  const fields = [
    parseField(parts[0], 0, 59),
    parseField(parts[1], 0, 23),
    parseField(parts[2], 1, 31),
    parseField(parts[3], 1, 12),
    parseField(parts[4], 0, 6),
  ]
  const actuals = [date.getMinutes(), date.getHours(), date.getDate(), date.getMonth() + 1, date.getDay()]
  return fields.every((f, i) => 'any' in f || f.values.includes(actuals[i]))
}

function isDue(job: CronJob, now: Date): boolean {
  if (!matchesCron(job.schedule, now)) return false
  const s = state.get(job.name)
  if (!s?.lastRun) return true
  return Math.floor(now.getTime() / 60_000) > Math.floor(new Date(s.lastRun).getTime() / 60_000)
}

// ── Job runner ──

async function runJob(job: CronJob): Promise<void> {
  const s = getOrInitState(job.name)
  if (s.running) return
  s.running = true
  clog(`Running: ${job.name} (${job.type})`)
  const start = Date.now()

  try {
    const output = job.type === 'hermes'
      ? await spawnHermes(job.prompt!, job.model ?? 'sonnet')
      : await spawnScript(job.command!)

    const durationMs = Date.now() - start
    clog(`${job.name} OK — ${durationMs}ms`)
    s.lastRun = new Date().toISOString()
    s.lastResult = 'ok'
    s.lastOutput = output.slice(0, 2000)
    s.consecutiveFailures = 0
    await dispatch(output, job.output, job.name)
  } catch (err) {
    s.lastRun = new Date().toISOString()
    s.lastResult = 'error'
    s.lastOutput = String(err).slice(0, 500)
    s.consecutiveFailures++
    clog(`${job.name} FAILED (${s.consecutiveFailures}x): ${err}`)
  } finally {
    s.running = false
  }
}

// ── Spawners ──

function spawnScript(command: string, timeoutMs = 60_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('bash', ['-c', command], { env: process.env })
    let out = ''
    proc.stdout.on('data', (d) => { out += d })
    proc.stderr.on('data', (d) => { out += d })
    const timer = setTimeout(() => { proc.kill('SIGTERM'); reject(new Error('timeout')) }, timeoutMs)
    proc.on('close', (code) => {
      clearTimeout(timer)
      code === 0 ? resolve(out.trim()) : reject(new Error(`exit ${code}: ${out.slice(0, 200)}`))
    })
  })
}

function spawnHermes(prompt: string, model: string, timeoutMs = 300_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env }
    // Remove any Hermes accept-hooks override to avoid interactive prompts in cron
    delete env.HERMES_ACCEPT_HOOKS
    const args = ['-z', prompt, '--model', model, '--accept-hooks']
    const proc = spawn(HERMES_BIN, args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    proc.stdin.end()
    let out = ''
    proc.stdout.on('data', (d) => { out += d })
    let errOut = ''
    proc.stderr.on('data', (d) => { errOut += d })
    const timer = setTimeout(() => { proc.kill('SIGTERM'); reject(new Error('hermes timeout')) }, timeoutMs)
    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        resolve(out.trim())
      } else {
        reject(new Error(`hermes exit ${code}: ${errOut.slice(0, 200)}`))
      }
    })
  })
}

// ── Output dispatch ──

async function dispatch(output: string, target: OutputTarget | OutputTarget[], jobName: string): Promise<void> {
  const targets = Array.isArray(target) ? target : [target]
  await Promise.allSettled(targets.map((t) => dispatchOne(output, t, jobName)))
}

async function dispatchOne(output: string, target: OutputTarget, jobName: string): Promise<void> {
  if (target === 'voice') {
    try {
      await fetch(VOICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: output.slice(0, 500), voice_enabled: true }),
        signal: AbortSignal.timeout(10_000),
      })
    } catch (err) {
      clog(`Voice dispatch failed for ${jobName}: ${err}`)
    }
  } else {
    clog(`[${jobName}] ${output.slice(0, 500)}`)
  }
}

// ── Helpers ──

function getOrInitState(name: string): JobState {
  if (!state.has(name)) state.set(name, { lastRun: null, lastResult: null, lastOutput: null, consecutiveFailures: 0, running: false })
  return state.get(name)!
}

function clog(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true })
    appendFileSync(LOG_FILE, line)
  } catch { /* best-effort */ }
  console.log(`[cron] ${msg}`)
}

// ── Public API ──

export function getJobsWithState(): Array<CronJob & { state: JobState }> {
  return jobs.map((j) => ({ ...j, state: getOrInitState(j.name) }))
}

export async function triggerJob(name: string): Promise<{ ok: boolean; error?: string }> {
  const job = jobs.find((j) => j.name === name)
  if (!job) return { ok: false, error: 'not found' }
  try {
    await runJob(job)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

export function toggleJob(name: string): { ok: boolean; enabled?: boolean; error?: string } {
  const job = jobs.find((j) => j.name === name)
  if (!job) return { ok: false, error: 'not found' }
  job.enabled = !job.enabled
  writeJobEnabled(name, job.enabled)
  return { ok: true, enabled: job.enabled }
}

export interface JobUpdate {
  schedule?: string
  prompt?: string
  command?: string
  output?: OutputTarget | OutputTarget[]
}

export function updateJob(name: string, fields: JobUpdate): { ok: boolean; error?: string } {
  const job = jobs.find((j) => j.name === name)
  if (!job) return { ok: false, error: 'not found' }
  if (fields.schedule !== undefined) job.schedule = fields.schedule
  if (fields.prompt !== undefined) job.prompt = fields.prompt
  if (fields.command !== undefined) job.command = fields.command
  if (fields.output !== undefined) job.output = fields.output
  try {
    patchTomlBlock(name, fields as Record<string, unknown>)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

function patchTomlBlock(name: string, fields: Record<string, unknown>): void {
  let raw = readFileSync(JOBS_TOML, 'utf-8')

  // Split on [[job]] boundaries, process each block independently
  const parts = raw.split(/(?=\[\[job\]\])/g)
  const patched = parts.map((block) => {
    const nameMatch = block.match(/^name\s*=\s*"([^"]+)"/m)
    if (nameMatch?.[1] !== name) return block

    let b = block
    for (const [key, val] of Object.entries(fields)) {
      if (val === undefined) continue
      const tomlVal = Array.isArray(val)
        ? `[${val.map((v) => `"${v}"`).join(', ')}]`
        : typeof val === 'string'
          ? `"${val}"`
          : String(val)
      const re = new RegExp(`^(${key}\\s*=\\s*).*`, 'm')
      if (re.test(b)) {
        b = b.replace(re, `$1${tomlVal}`)
      } else {
        // Field doesn't exist yet — append before the next blank line or end of block
        b = b.trimEnd() + `\n${key} = ${tomlVal}\n`
      }
    }
    return b
  })

  writeFileSync(JOBS_TOML, patched.join(''), 'utf-8')
  clog(`jobs.toml updated: ${name} — ${Object.keys(fields).join(', ')}`)
}

function writeJobEnabled(name: string, enabled: boolean): void {
  try {
    patchTomlBlock(name, { enabled })
  } catch (err) {
    clog(`Failed to write jobs.toml: ${err}`)
  }
}

export function cronEngine() {
  return {
    start() {
      if (started) return
      started = true
      loadJobs()
      watchFile(JOBS_TOML, { interval: 5000 }, () => {
        clog('jobs.toml changed — reloading')
        loadJobs()
      })
      tickHandle = setInterval(async () => {
        const now = new Date()
        for (const job of jobs) {
          if (!job.enabled) continue
          if (isDue(job, now)) runJob(job).catch(() => {})
        }
      }, 60_000)
      clog('Cron engine started')
    },
    stop() {
      if (tickHandle) clearInterval(tickHandle)
      started = false
    },
  }
}
