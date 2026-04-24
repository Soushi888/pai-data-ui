import { json } from '@sveltejs/kit'
import { Effect } from 'effect'
import { createInvoice, listInvoices } from '$lib/data/invoices.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status')
  const org = url.searchParams.get('org')

  const result = await Effect.runPromise(Effect.either(listInvoices()))
  if (result._tag === 'Left') return errorResponse(result.left)

  let invoices = result.right
  if (status) invoices = invoices.filter((i) => i.status === status)
  if (org) invoices = invoices.filter((i) =>
    i.organization.toLowerCase().includes(org.toLowerCase())
  )

  invoices.sort((a, b) => b.issue_date.localeCompare(a.issue_date))
  return json({ invoices, total: invoices.length })
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const result = await Effect.runPromise(Effect.either(createInvoice(body)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ invoice: result.right }, { status: 201 })
}
