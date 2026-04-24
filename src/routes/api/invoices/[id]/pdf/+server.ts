import { createReadStream } from 'node:fs'
import { Effect } from 'effect'
import { generateInvoicePdf, getInvoice, pdfPath } from '$lib/data/invoices.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  const existing = pdfPath(params.id)
  if (existing) {
    const stream = createReadStream(existing)
    return new Response(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${params.id}.pdf"`
      }
    })
  }

  const result = await Effect.runPromise(Effect.either(getInvoice(params.id)))
  if (result._tag === 'Left') return new Response('Invoice not found', { status: 404 })

  const pdfBuffer = await generateInvoicePdf(result.right.data)
  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${params.id}.pdf"`
    }
  })
}
