import { createReadStream } from 'node:fs'
import { pdfPath } from '$lib/data/invoices.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ params }) => {
  const path = pdfPath(params.id)
  if (!path) return new Response('PDF not found', { status: 404 })

  const stream = createReadStream(path)
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${params.id}.pdf"`
    }
  })
}
