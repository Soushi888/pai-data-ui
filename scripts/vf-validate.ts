#!/usr/bin/env node
// Validates VF 1.0 referential integrity across all PAI DataLayer entities.
// Run: npx tsx scripts/vf-validate.ts
// Exit 0 on clean, 1 on any FAIL.
import matter from 'gray-matter'
import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

const DATA_ROOT = process.env.PAI_DATA_ROOT ?? `${process.env.HOME}/.claude/PAI/USER/DATA`

const VALID_ACTIONS = new Set([
  'work',
  'use',
  'consume',
  'produce',
  'transfer',
  'transfer-custody',
  'transfer-all-rights',
  'move',
  'deliver-service',
  'cite',
  'receive',
  'raise',
  'lower',
])

const EVENT_TYPES = new Set(['task', 'expense', 'income'])

interface Fail {
  file: string
  field: string
  message: string
}

interface Warn {
  file: string
  field: string
  message: string
}

async function* walkMd(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_')) continue
      yield* walkMd(full)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      yield full
    }
  }
}

async function loadIds(): Promise<{ entityIds: Set<string>; rspecIds: Set<string> }> {
  const entityIds = new Set<string>()
  const rspecIds = new Set<string>()
  for await (const file of walkMd(DATA_ROOT)) {
    const { data } = matter(readFileSync(file, 'utf8'))
    const id = String(data.id ?? '').trim()
    if (!id) continue
    entityIds.add(id)
    const type = String(data.type ?? '').replace(/"/g, '').trim()
    if (type === 'resource-spec') rspecIds.add(id)
  }
  return { entityIds, rspecIds }
}

async function validate() {
  const { entityIds, rspecIds } = await loadIds()
  const fails: Fail[] = []
  const warns: Warn[] = []
  let passCount = 0

  for await (const file of walkMd(DATA_ROOT)) {
    const raw = readFileSync(file, 'utf8')
    const { data } = matter(raw)
    const type = String(data.type ?? '').replace(/"/g, '').trim()
    if (!EVENT_TYPES.has(type)) continue

    const shortFile = file.replace(DATA_ROOT + '/', '')
    let entityPass = true

    const action = data.vf_action as string | null | undefined
    if (action == null) {
      warns.push({ file: shortFile, field: 'vf_action', message: 'null — could be populated' })
    } else if (!VALID_ACTIONS.has(action)) {
      fails.push({
        file: shortFile,
        field: 'vf_action',
        message: `"${action}" is not a valid VF 1.0 action`,
      })
      entityPass = false
    }

    for (const field of ['vf_provider', 'vf_receiver'] as const) {
      const val = data[field] as string | null | undefined
      if (val != null && !entityIds.has(val)) {
        fails.push({
          file: shortFile,
          field,
          message: `"${val}" does not reference a known entity ID`,
        })
        entityPass = false
      }
    }

    const rspec = data.vf_resource_conforms_to as string | null | undefined
    if (rspec != null && !rspecIds.has(rspec)) {
      fails.push({
        file: shortFile,
        field: 'vf_resource_conforms_to',
        message: `"${rspec}" does not reference a known resource-spec ID`,
      })
      entityPass = false
    }

    const qty = data.vf_resource_quantity as Record<string, unknown> | null | undefined
    if (qty != null) {
      if (typeof qty.numericValue !== 'number') {
        fails.push({
          file: shortFile,
          field: 'vf_resource_quantity.numericValue',
          message: 'must be a number when vf_resource_quantity is present',
        })
        entityPass = false
      }
      if (typeof qty.unit !== 'string' || !qty.unit) {
        fails.push({
          file: shortFile,
          field: 'vf_resource_quantity.unit',
          message: 'must be a non-empty string when vf_resource_quantity is present',
        })
        entityPass = false
      }
    } else {
      warns.push({ file: shortFile, field: 'vf_resource_quantity', message: 'null — could be populated' })
    }

    for (const field of ['vf_input_of', 'vf_output_of'] as const) {
      const val = data[field] as string | null | undefined
      if (val != null && !entityIds.has(val)) {
        fails.push({
          file: shortFile,
          field,
          message: `"${val}" does not reference a known entity ID`,
        })
        entityPass = false
      }
    }

    if (entityPass) passCount++
  }

  console.log(`\nVF Validation Results`)
  console.log(`=====================`)
  console.log(`PASS: ${passCount}`)
  console.log(`FAIL: ${fails.length}`)
  console.log(`WARN: ${warns.length}`)

  if (fails.length > 0) {
    console.log(`\nFAILURES:`)
    for (const f of fails) {
      console.log(`  [FAIL] ${f.file}`)
      console.log(`         ${f.field}: ${f.message}`)
    }
  }

  if (warns.length > 0) {
    console.log(`\nWARNINGS (null fields that could be populated):`)
    for (const w of warns) {
      console.log(`  [WARN] ${w.file} — ${w.field}: ${w.message}`)
    }
  }

  process.exit(fails.length > 0 ? 1 : 0)
}

validate().catch((err) => {
  console.error(err)
  process.exit(1)
})
