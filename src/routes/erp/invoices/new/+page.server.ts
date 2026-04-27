import { redirect } from '@sveltejs/kit'
import { Effect } from 'effect'
import { createInvoice } from '$lib/data/invoices.js'
import { createOrganization, listOrganizations } from '$lib/data/organizations.js'
import { createContact, listContacts } from '$lib/data/contacts.js'
import { listOpportunities } from '$lib/data/opportunities.js'
import type { PageServerLoad } from './$types'

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
