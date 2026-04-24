import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import PDFDocument from 'pdfkit'
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

export function createInvoice(
  data: Omit<Invoice, 'id' | 'type' | 'number' | 'created' | 'updated'>
): Effect.Effect<Invoice, DataError> {
  return Effect.flatMap(listInvoices(), (existing) => {
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const monthKey = `${year}${month}` // e.g. "202604"
    const yymm = monthKey.slice(2) // e.g. "2604"

    const thisMonth = existing.filter((inv) => inv.id.startsWith(`inv-${year}${month}-`))
    const seq =
      thisMonth
        .map((inv) => Number.parseInt(inv.id.split('-').at(-1) ?? '0', 10))
        .reduce((max, n) => Math.max(max, n), 0) + 1
    const seqStr = String(seq).padStart(4, '0')

    const id = `inv-${monthKey}-${seqStr}`
    const number = `IN${yymm}-${seqStr}`
    const today = now.toISOString().split('T')[0]

    const invoice: Invoice = {
      ...data,
      id,
      type: 'invoice',
      number,
      created: today,
      updated: today
    }

    return Effect.map(
      writeEntity(filePath(id), invoice as unknown as Record<string, unknown>, ''),
      () => invoice
    )
  })
}

export function generateInvoicePdf(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const issuer = process.env.INVOICE_ISSUER_NAME ?? 'Freelancer'
    const fmt = (n: number) => `$${n.toFixed(2)} ${invoice.currency}`

    // ── Header ────────────────────────────────────────────────
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#000000').text(issuer, 50, 50)
    doc.fontSize(10).font('Helvetica').fillColor('#666666').text('INVOICE', 50, 80)
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text(invoice.number, 50, 95)

    // ── Client info (right column) ────────────────────────────
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#333333')
      .text(`Bill To: ${invoice.organization}`, 300, 80, { align: 'right', width: 245 })
      .text(`Issue Date: ${invoice.issue_date}`, 300, 95, { align: 'right', width: 245 })
      .text(`Due Date: ${invoice.due_date}`, 300, 110, { align: 'right', width: 245 })

    if (invoice.paid_date) {
      doc
        .fillColor('#2e7d32')
        .text(`Paid: ${invoice.paid_date}`, 300, 125, { align: 'right', width: 245 })
    }

    // ── Line items table ──────────────────────────────────────
    const tableTop = 160
    doc.moveTo(50, tableTop - 5).lineTo(545, tableTop - 5).strokeColor('#cccccc').stroke()

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#666666')
      .text('DESCRIPTION', 50, tableTop)
      .text('QTY', 330, tableTop, { width: 50, align: 'right' })
      .text('UNIT PRICE', 385, tableTop, { width: 80, align: 'right' })
      .text('AMOUNT', 470, tableTop, { width: 75, align: 'right' })

    doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).strokeColor('#cccccc').stroke()

    let y = tableTop + 22
    doc.font('Helvetica').fillColor('#000000')

    for (const item of invoice.line_items) {
      doc
        .fontSize(9)
        .text(item.description, 50, y, { width: 270 })
        .text(String(item.quantity), 330, y, { width: 50, align: 'right' })
        .text(fmt(item.unit_price), 385, y, { width: 80, align: 'right' })
        .text(fmt(item.amount), 470, y, { width: 75, align: 'right' })
      y += 20
    }

    // ── Totals ────────────────────────────────────────────────
    doc.moveTo(370, y + 5).lineTo(545, y + 5).strokeColor('#cccccc').stroke()
    y += 12

    doc
      .fontSize(9)
      .fillColor('#333333')
      .text('Subtotal', 370, y, { width: 95 })
      .text(fmt(invoice.subtotal), 470, y, { width: 75, align: 'right' })
    y += 16

    if (invoice.tax_amount) {
      doc
        .text(invoice.tax_label ?? 'Tax', 370, y, { width: 95 })
        .text(fmt(invoice.tax_amount), 470, y, { width: 75, align: 'right' })
      y += 16
    }

    doc.moveTo(370, y).lineTo(545, y).strokeColor('#cccccc').stroke()
    y += 6

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('TOTAL', 370, y, { width: 95 })
      .text(fmt(invoice.total), 470, y, { width: 75, align: 'right' })

    // ── Notes ─────────────────────────────────────────────────
    if (invoice.notes) {
      y += 40
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#666666')
        .text('Notes', 50, y)
        .font('Helvetica')
        .fillColor('#333333')
        .text(invoice.notes, 50, y + 14, { width: 495 })
    }

    doc.end()
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
