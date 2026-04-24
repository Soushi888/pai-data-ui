import { redirect } from '@sveltejs/kit'
import { Effect } from 'effect'
import { createInvoice } from '$lib/data/invoices.js'
import { createOrganization, listOrganizations } from '$lib/data/organizations.js'
import { createContact, listContacts } from '$lib/data/contacts.js'
import { listOpportunities } from '$lib/data/opportunities.js'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const [orgsResult, contactsResult, oppsResult] = await Promise.all([
    Effect.runPromise(Effect.either(listOrganizations())),
    Effect.runPromise(Effect.either(listContacts())),
    Effect.runPromise(Effect.either(listOpportunities()))
  ])
  const organizations = orgsResult._tag === 'Right' ? orgsResult.right : []
  const contacts = contactsResult._tag === 'Right' ? contactsResult.right : []
  const opportunities = oppsResult._tag === 'Right' ? oppsResult.right : []
  organizations.sort((a, b) => a.name.localeCompare(b.name))
  contacts.sort((a, b) => a.name.localeCompare(b.name))
  opportunities.sort((a, b) => a.title.localeCompare(b.title))
  return { organizations, contacts, opportunities }
}

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await request.formData()

    let orgName = ((form.get('organization') as string) || '').trim()
    const orgId = (form.get('organization_id') as string | null)?.trim() || undefined
    const contactName = (form.get('contact_name') as string | null)?.trim() || undefined
    const contactId = (form.get('contact_id') as string | null)?.trim() || undefined

    if (!orgName && !contactName) return { error: 'At least one of Organization or Contact is required.' }
    if (!orgName && contactName) orgName = contactName
    const currency = (form.get('currency') as string) || 'CAD'
    const issue_date = form.get('issue_date') as string
    const due_date = form.get('due_date') as string
    const status = (form.get('status') as string || 'draft') as
      'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
    const tagsRaw = (form.get('tags') as string | null) || ''
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    const opportunity = (form.get('opportunity_id') as string | null)?.trim() || undefined
    const notes = (form.get('notes') as string | null)?.trim() || undefined

    const taxRateRaw = form.get('tax_rate') as string | null
    const tax_rate = taxRateRaw ? Number.parseFloat(taxRateRaw) : undefined
    const tax_label = (form.get('tax_label') as string | null)?.trim() || undefined

    const descriptions = form.getAll('description') as string[]
    const quantities = form.getAll('quantity') as string[]
    const unit_prices = form.getAll('unit_price') as string[]

    const line_items = descriptions
      .map((desc, i) => {
        const qty = Number.parseFloat(quantities[i] || '0')
        const price = Number.parseFloat(unit_prices[i] || '0')
        return { description: desc, quantity: qty, unit_price: price, amount: qty * price }
      })
      .filter((item) => item.description.trim())

    const subtotal = line_items.reduce((sum, item) => sum + item.amount, 0)
    const tax_amount = tax_rate ? Math.round(subtotal * tax_rate * 100) / 100 : undefined
    const total = subtotal + (tax_amount ?? 0)

    // Stub-create organization if name provided but no ID (new org)
    let resolvedOrgId = orgId
    if (!resolvedOrgId && orgName) {
      const stubResult = await Effect.runPromise(
        Effect.either(
          createOrganization({
            name: orgName,
            domain: '',
            status: 'active',
            tags: []
          })
        )
      )
      if (stubResult._tag === 'Right') resolvedOrgId = stubResult.right.id
    }

    // Stub-create contact if name provided but no ID (new contact)
    let resolvedContactId = contactId
    if (contactName && !resolvedContactId) {
      const today = new Date().toISOString().split('T')[0]
      const stubResult = await Effect.runPromise(
        Effect.either(
          createContact({
            name: contactName,
            organization: orgName,
            role: '',
            status: 'active',
            last_contact: today,
            tags: []
          })
        )
      )
      if (stubResult._tag === 'Right') resolvedContactId = stubResult.right.id
    }

    const result = await Effect.runPromise(
      Effect.either(
        createInvoice({
          organization: orgName,
          organization_id: resolvedOrgId,
          contact: resolvedContactId,
          currency,
          issue_date,
          due_date,
          status,
          tags,
          opportunity: opportunity ?? null,
          line_items,
          subtotal,
          tax_rate,
          tax_label,
          tax_amount,
          total,
          paid_date: null,
          notes
        })
      )
    )

    if (result._tag === 'Left') return { error: 'Failed to create invoice' }
    redirect(303, `/erp/invoices/${result.right.id}`)
  }
}
