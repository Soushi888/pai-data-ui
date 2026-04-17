import { Effect } from 'effect'
import { listContacts } from '$lib/data/contacts.js'
import { listInvoices } from '$lib/data/invoices.js'
import { listOpportunities } from '$lib/data/opportunities.js'
import { listOrganizations } from '$lib/data/organizations.js'
import { listProjects } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async () => {
  const [contacts, opps, orgs, invoices, projects, tasks] = await Promise.all([
    Effect.runPromise(Effect.either(listContacts())),
    Effect.runPromise(Effect.either(listOpportunities())),
    Effect.runPromise(Effect.either(listOrganizations())),
    Effect.runPromise(Effect.either(listInvoices())),
    Effect.runPromise(Effect.either(listProjects())),
    Effect.runPromise(Effect.either(listTasks()))
  ])

  return {
    counts: {
      contacts: contacts._tag === 'Right' ? contacts.right.length : 0,
      opportunities: opps._tag === 'Right' ? opps.right.length : 0,
      organizations: orgs._tag === 'Right' ? orgs.right.length : 0,
      invoices: invoices._tag === 'Right' ? invoices.right.length : 0,
      projects: projects._tag === 'Right' ? projects.right.length : 0,
      tasks: tasks._tag === 'Right' ? tasks.right.length : 0
    }
  }
}
