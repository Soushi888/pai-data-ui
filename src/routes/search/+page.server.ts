import { Effect } from 'effect'
import { listContacts } from '$lib/data/contacts.js'
import { listInvoices } from '$lib/data/invoices.js'
import { listOpportunities } from '$lib/data/opportunities.js'
import { listOrganizations } from '$lib/data/organizations.js'
import { listProjects } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import type { SearchResult } from '$lib/data/types.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
  const q = url.searchParams.get('q')?.toLowerCase() ?? ''
  if (!q) return { q, results: [] }

  const [contacts, opps, orgs, invoices, projects, tasks] = await Promise.all([
    Effect.runPromise(Effect.either(listContacts())),
    Effect.runPromise(Effect.either(listOpportunities())),
    Effect.runPromise(Effect.either(listOrganizations())),
    Effect.runPromise(Effect.either(listInvoices())),
    Effect.runPromise(Effect.either(listProjects())),
    Effect.runPromise(Effect.either(listTasks()))
  ])

  const results: SearchResult[] = []

  function matches(...fields: (string | undefined)[]): boolean {
    return fields.some((f) => f?.toLowerCase().includes(q))
  }

  if (contacts._tag === 'Right') {
    for (const c of contacts.right) {
      if (matches(c.name, c.organization, c.role, c.nickname, ...(c.tags ?? []))) {
        results.push({ type: 'contact', id: c.id, title: c.name, excerpt: c.organization })
      }
    }
  }
  if (opps._tag === 'Right') {
    for (const o of opps.right) {
      if (matches(o.title, o.organization, o.notes, ...(o.tags ?? []))) {
        results.push({ type: 'opportunity', id: o.id, title: o.title, excerpt: o.organization })
      }
    }
  }
  if (orgs._tag === 'Right') {
    for (const o of orgs.right) {
      if (matches(o.name, o.domain, ...(o.tags ?? []))) {
        results.push({ type: 'organization', id: o.id, title: o.name, excerpt: o.domain })
      }
    }
  }
  if (invoices._tag === 'Right') {
    for (const i of invoices.right) {
      if (matches(i.number, i.organization, ...(i.tags ?? []))) {
        results.push({ type: 'invoice', id: i.id, title: i.number, excerpt: i.organization })
      }
    }
  }
  if (projects._tag === 'Right') {
    for (const p of projects.right) {
      if (matches(p.title, p.organization, p.notes, ...(p.tags ?? []))) {
        results.push({ type: 'project', id: p.id, title: p.title, excerpt: p.organization ?? '' })
      }
    }
  }
  if (tasks._tag === 'Right') {
    for (const t of tasks.right) {
      if (matches(t.title, t.epic, ...(t.tags ?? []))) {
        results.push({ type: 'task', id: t.id, title: t.title, excerpt: t.project_id })
      }
    }
  }

  return { q, results }
}
