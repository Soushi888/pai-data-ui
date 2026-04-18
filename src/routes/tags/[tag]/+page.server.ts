import { Effect } from 'effect'
import { listContacts } from '$lib/data/contacts.js'
import { listOpportunities } from '$lib/data/opportunities.js'
import { listOrganizations } from '$lib/data/organizations.js'
import { listProjects } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import { listInvoices } from '$lib/data/invoices.js'
import type { PageServerLoad } from './$types.js'

export const load: PageServerLoad = async ({ params }) => {
  const { tag } = params
  const hasTag = (tags?: string[]) => tags?.includes(tag) ?? false

  const [contacts, opportunities, organizations, projects, tasks, invoices] = await Promise.all([
    Effect.runPromise(Effect.map(listContacts(), (cs) => cs.filter((c) => hasTag(c.tags)))),
    Effect.runPromise(Effect.map(listOpportunities(), (os) => os.filter((o) => hasTag(o.tags)))),
    Effect.runPromise(Effect.map(listOrganizations(), (os) => os.filter((o) => hasTag(o.tags)))),
    Effect.runPromise(Effect.map(listProjects(), (ps) => ps.filter((p) => hasTag(p.tags)))),
    Effect.runPromise(Effect.map(listTasks(), (ts) => ts.filter((t) => hasTag(t.tags)))),
    Effect.runPromise(Effect.map(listInvoices(), (is) => is.filter((i) => hasTag(i.tags)))),
  ])

  return { tag, contacts, opportunities, organizations, projects, tasks, invoices }
}
