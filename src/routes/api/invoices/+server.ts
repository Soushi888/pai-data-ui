import { json } from '@sveltejs/kit'
import { Effect } from 'effect'
import { createInvoice, listInvoices } from '$lib/data/invoices.js'
import { createOrganization } from '$lib/data/organizations.js'
import { createContact } from '$lib/data/contacts.js'
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

  let resolvedOrgId = body.organization_id || undefined
  if (!resolvedOrgId && body.organization) {
    const r = await Effect.runPromise(Effect.either(createOrganization({
      name: body.organization, domain: '', status: 'active', tags: []
    })))
    if (r._tag === 'Right') resolvedOrgId = r.right.id
  }

  let resolvedContactId = body.contact_id || undefined
  if (!resolvedContactId && body.contact_name) {
    const today = new Date().toISOString().split('T')[0]
    const r = await Effect.runPromise(Effect.either(createContact({
      name: body.contact_name, organization: body.organization ?? '', role: '',
      status: 'active', last_contact: today, tags: []
    })))
    if (r._tag === 'Right') resolvedContactId = r.right.id
  }

  const result = await Effect.runPromise(Effect.either(createInvoice({
    ...body,
    organization_id: resolvedOrgId,
    contact: resolvedContactId
  })))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ invoice: result.right }, { status: 201 })
}
