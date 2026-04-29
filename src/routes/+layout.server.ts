import { Effect as E } from 'effect'
import { listContacts } from '$lib/data/contacts.js'
import { listExpenses } from '$lib/data/expenses.js'
import { listIncome } from '$lib/data/income.js'
import { listInvoices } from '$lib/data/invoices.js'
import { listOpportunities } from '$lib/data/opportunities.js'
import { listOrganizations } from '$lib/data/organizations.js'
import { listProjects } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import { getDb } from '$lib/server/index-db.js'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async () => {
  const [contacts, opps, orgs, invoices, projects, tasks, expenses, incomeList] = await Promise.all([
    E.runPromise(E.either(listContacts())),
    E.runPromise(E.either(listOpportunities())),
    E.runPromise(E.either(listOrganizations())),
    E.runPromise(E.either(listInvoices())),
    E.runPromise(E.either(listProjects())),
    E.runPromise(E.either(listTasks())),
    E.runPromise(E.either(listExpenses())),
    E.runPromise(E.either(listIncome()))
  ])

  const vfCount = (getDb().prepare('SELECT count(*) as n FROM vf_economic_events').get() as { n: number }).n

  return {
    counts: {
      contacts: contacts._tag === 'Right' ? contacts.right.length : 0,
      opportunities: opps._tag === 'Right' ? opps.right.filter((o) => o.status !== 'archived').length : 0,
      organizations: orgs._tag === 'Right' ? orgs.right.length : 0,
      invoices: invoices._tag === 'Right' ? invoices.right.length : 0,
      projects: projects._tag === 'Right' ? projects.right.filter((p) => p.status !== 'archived').length : 0,
      tasks: tasks._tag === 'Right' ? tasks.right.length : 0,
      expenses: expenses._tag === 'Right' ? expenses.right.filter((e) => e.status === 'active').length : 0,
      income: incomeList._tag === 'Right' ? incomeList.right.length : 0,
      vfEvents: vfCount
    }
  }
}
