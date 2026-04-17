import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { Effect } from 'effect'
import type { DataError } from './errors.js'
import { DATA_ROOT, dataPath, listDir, readEntity, requireEntity, writeEntity } from './parser.js'
import type { EntityWithBody, Invoice } from './types.js'

const dir = () => dataPath('ERP', 'invoices')
const filePath = (id: string) => `${dir()}/${id}.md`

export function listInvoices(): Effect.Effect<Invoice[], DataError> {
  return Effect.flatMap(listDir(dir()), (paths) =>
    Effect.all(
      paths.map((p) => Effect.map(readEntity<Invoice>(p), (e) => e.data)),
      { concurrency: 10 }
    )
  )
}

export function getInvoice(id: string): Effect.Effect<EntityWithBody<Invoice>, DataError> {
  return requireEntity<Invoice>(filePath(id), id)
}

export function updateInvoice(
  id: string,
  patch: Partial<Invoice>,
  body?: string
): Effect.Effect<Invoice, DataError> {
  return Effect.flatMap(getInvoice(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch, updated: new Date().toISOString().split('T')[0] }
    return Effect.map(
      writeEntity(filePath(id), updated as unknown as Record<string, unknown>, body ?? existingBody),
      () => updated
    )
  })
}

export function pdfPath(id: string): string | null {
  const exportsDir = join(DATA_ROOT, 'ERP', 'exports')

  const numbered = id.replace('inv-', '').replace(/-/g, '')
  const humanId = `IN${numbered}`

  const candidates = [
    join(exportsDir, 'invoices', id, `${humanId}.pdf`),
    join(exportsDir, 'invoices', id, `${humanId}-client.pdf`),
    join(exportsDir, 'invoices', id, `${id}.pdf`),
    join(exportsDir, id, `${humanId}.pdf`),
    join(exportsDir, id, `${id}.pdf`)
  ]

  for (const c of candidates) {
    if (existsSync(c)) return c
  }

  const dirs = [join(exportsDir, 'invoices', id), join(exportsDir, id)]
  for (const d of dirs) {
    if (existsSync(d)) {
      const pdfs = readdirSync(d).filter((f) => f.endsWith('.pdf'))
      if (pdfs.length) return join(d, pdfs[0])
    }
  }

  return null
}
