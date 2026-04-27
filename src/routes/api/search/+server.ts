import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { listContacts } from '$lib/data/contacts.js'
import { listInvoices } from '$lib/data/invoices.js'
import { listOpportunities } from '$lib/data/opportunities.js'
import { listOrganizations } from '$lib/data/organizations.js'
import { listProjects } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import type { SearchResult } from '$lib/data/types.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const q = url.searchParams.get('q')?.toLowerCase() ?? ''
  const typeFilter = url.searchParams.get('type')

  if (!q) return json({ results: [] })

  const [contacts, opps, orgs, invoices, projects, tasks] = await Promise.all([
    E.runPromise(E.either(listContacts())),
    E.runPromise(E.either(listOpportunities())),
    E.runPromise(E.either(listOrganizations())),
    E.runPromise(E.either(listInvoices())),
    E.runPromise(E.either(listProjects())),
    E.runPromise(E.either(listTasks()))
  ])

  const results: SearchResult[] = []

  function excerpt(text: string): string {
    const idx = text.toLowerCase().indexOf(q)
    if (idx === -1) return text.slice(0, 80)
    const start = Math.max(0, idx - 30)
    return (start > 0 ? '…' : '') + text.slice(start, idx + q.length + 40).trim() + '…'
  }

  function matches(...fields: (string | undefined)[]): boolean {
    return fields.some((f) => f?.toLowerCase().includes(q))
  }

  if (!typeFilter || typeFilter === 'contact') {
    if (contacts._tag === 'Right') {
      for (const c of contacts.right) {
        if (matches(c.name, c.organization, c.role, c.nickname, ...(c.tags ?? []))) {
          results.push({ type: 'contact', id: c.id, title: c.name, excerpt: excerpt(c.organization) })
        }
      }
    }
  }

  if (!typeFilter || typeFilter === 'opportunity') {
    if (opps._tag === 'Right') {
      for (const o of opps.right) {
        if (matches(o.title, o.organization, o.description, ...(o.tags ?? []))) {
          results.push({ type: 'opportunity', id: o.id, title: o.title, excerpt: excerpt(o.organization) })
        }
      }
    }
  }

  if (!typeFilter || typeFilter === 'organization') {
    if (orgs._tag === 'Right') {
      for (const o of orgs.right) {
        if (matches(o.name, o.domain, ...(o.tags ?? []))) {
          results.push({ type: 'organization', id: o.id, title: o.name, excerpt: o.domain })
        }
      }
    }
  }

  if (!typeFilter || typeFilter === 'invoice') {
    if (invoices._tag === 'Right') {
      for (const i of invoices.right) {
        if (matches(i.number, i.organization, i.notes, ...(i.tags ?? []))) {
          results.push({ type: 'invoice', id: i.id, title: i.number, excerpt: i.organization })
        }
      }
    }
  }

  if (!typeFilter || typeFilter === 'project') {
    if (projects._tag === 'Right') {
      for (const p of projects.right) {
        if (matches(p.title, p.organization, p.notes, ...(p.tags ?? []))) {
          results.push({ type: 'project', id: p.id, title: p.title, excerpt: p.organization ?? '' })
        }
      }
    }
  }

  if (!typeFilter || typeFilter === 'task') {
    if (tasks._tag === 'Right') {
      for (const t of tasks.right) {
        if (matches(t.title, t.epic, ...(t.tags ?? []))) {
          results.push({ type: 'task', id: t.id, title: t.title, excerpt: t.project_id })
        }
      }
    }
  }

  return json({ results, total: results.length })
}
