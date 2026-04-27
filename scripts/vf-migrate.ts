#!/usr/bin/env node
// Adds VF 1.0 overlay fields to existing PAI DataLayer entities.
// Run: npx tsx scripts/vf-migrate.ts
// Idempotent: never overwrites existing vf_* values. Second run patches 0 files.
import matter from 'gray-matter'
import { readFileSync, writeFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

const DATA_ROOT = process.env.PAI_DATA_ROOT ?? `${process.env.HOME}/.claude/PAI/USER/DATA`
const SELF_AGENT = 'contact-soushi888'

type Overlay = (data: Record<string, unknown>) => Record<string, unknown>

const OVERLAYS: Record<string, Overlay> = {
  task: (data) => ({
    vf_action: data.vf_action ?? 'work',
    vf_provider: data.vf_provider ?? SELF_AGENT,
    vf_receiver: data.vf_receiver ?? (data.project_id ?? null),
    vf_input_of: data.vf_input_of ?? (data.project_id ?? null),
    vf_resource_quantity: data.vf_resource_quantity ?? null,
    vf_resource_conforms_to: data.vf_resource_conforms_to ?? 'rspec-dev-hours',
    vf_has_point_in_time:
      data.vf_has_point_in_time ?? (data.updated ?? data.created ?? null),
  }),
  expense: (data) => ({
    vf_action: data.vf_action ?? 'use',
    vf_provider: data.vf_provider ?? SELF_AGENT,
    vf_receiver: data.vf_receiver ?? null,
    vf_input_of: data.vf_input_of ?? null,
    vf_resource_quantity:
      data.vf_resource_quantity ??
      (data.amount != null
        ? { numericValue: data.amount, unit: data.currency ?? 'EUR' }
        : null),
    vf_resource_conforms_to: data.vf_resource_conforms_to ?? null,
    vf_has_point_in_time:
      data.vf_has_point_in_time ?? (data.date ?? data.created ?? null),
  }),
  income: (data) => ({
    vf_action: data.vf_action ?? 'receive',
    vf_provider: data.vf_provider ?? null,
    vf_receiver: data.vf_receiver ?? SELF_AGENT,
    vf_output_of: data.vf_output_of ?? null,
    vf_resource_quantity:
      data.vf_resource_quantity ??
      (data.amount != null
        ? { numericValue: data.amount, unit: data.currency ?? 'EUR' }
        : null),
    vf_resource_conforms_to: data.vf_resource_conforms_to ?? 'rspec-eur',
    vf_has_point_in_time:
      data.vf_has_point_in_time ?? (data.date ?? data.created ?? null),
  }),
  invoice: (data) => ({
    vf_triggered_by: data.vf_triggered_by ?? [],
    vf_agreed_commitments: data.vf_agreed_commitments ?? [],
    vf_settled_by: data.vf_settled_by ?? [],
    vf_resource_quantity:
      data.vf_resource_quantity ??
      (data.total != null
        ? { numericValue: data.total, unit: data.currency ?? 'EUR' }
        : null),
  }),
  project: (data) => ({
    vf_has_beginning: data.vf_has_beginning ?? (data.created ?? null),
    vf_has_end: data.vf_has_end ?? null,
    vf_in_scope_of: data.vf_in_scope_of ?? null,
    vf_based_on: data.vf_based_on ?? null,
    vf_classified_as:
      data.vf_classified_as ??
      (['ovn', 'nondominium', 'happenings'].some((k) =>
        String(data.id ?? '').includes(k)
      )
        ? 'ovn'
        : String(data.type_detail ?? data.type ?? '').includes('research')
          ? 'research'
          : 'freelance'),
  }),
  contact: (data) => ({
    vf_type: data.vf_type ?? 'Person',
    vf_primary_location: data.vf_primary_location ?? null,
    vf_in_scope_of: data.vf_in_scope_of ?? null,
  }),
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

async function migrate() {
  let total = 0
  let modified = 0

  for await (const file of walkMd(DATA_ROOT)) {
    const raw = readFileSync(file, 'utf8')
    const { data, content } = matter(raw)
    const rawType = String(data.type ?? '')
    const type = rawType.replace(/"/g, '').trim()
    const overlay = OVERLAYS[type]
    if (!overlay) continue
    total++

    const patch = overlay(data as Record<string, unknown>)
    let changed = false
    for (const [k, v] of Object.entries(patch)) {
      if (!(k in data)) {
        (data as Record<string, unknown>)[k] = v
        changed = true
      }
    }
    if (changed) {
      writeFileSync(file, matter.stringify(content, data as Record<string, unknown>))
      modified++
      console.log(`  patched: ${file}`)
    }
  }

  console.log(`\nDone. Scanned ${total} files, patched ${modified}.`)
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
