import { error } from '@sveltejs/kit'
import { Effect } from 'effect'
import { getInvoice, pdfPath } from '$lib/data/invoices.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const result = await Effect.runPromise(Effect.either(getInvoice(params.id)))
  if (result._tag === 'Left') throw error(404, 'Invoice not found')
  const hasPdf = !!pdfPath(params.id)
  return { invoice: result.right.data, body: result.right.body, hasPdf }
}
