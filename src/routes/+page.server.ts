import { fail } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { listContacts, updateContact } from '$lib/data/contacts.js'
import { listInvoices } from '$lib/data/invoices.js'
import { listProjects } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import { queryTimeEntries } from '$lib/server/index-db.js'
import type { PageServerLoad, Actions } from './$types'

function getMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function daysAgo(dateStr: string): number {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  return Math.floor((now - then) / 86400000)
}

export const load: PageServerLoad = async () => {
  const [contacts, invoices, projects, tasks] = await Promise.all([
    E.runPromise(E.either(listContacts())),
    E.runPromise(E.either(listInvoices())),
    E.runPromise(E.either(listProjects())),
    E.runPromise(E.either(listTasks()))
  ])

  const allContacts = contacts._tag === 'Right' ? contacts.right : []
  const allInvoices = invoices._tag === 'Right' ? invoices.right : []
  const allProjects = projects._tag === 'Right' ? projects.right : []
  const allTasks = tasks._tag === 'Right' ? tasks.right : []

  const monday = getMonday()
  const activeContacts = allContacts.filter((c) => c.status === 'active')
  const openInvoices = allInvoices.filter((i) => i.status === 'sent' || i.status === 'overdue')
  const outstanding = openInvoices.reduce((sum, i) => sum + i.total, 0)
  const activeProjects = allProjects.filter((p) => p.status === 'active')
  const inProgressTasks = allTasks.filter((t) => t.status === 'in-progress')
  const weekEntries = queryTimeEntries({ dateFrom: monday })
  const hoursThisWeek = weekEntries.reduce((sum, e) => sum + ((e as { hours_rounded?: number }).hours_rounded ?? 0), 0)

  const followUpNeeded = allContacts
    .filter((c) => c.status === 'active' && c.last_contact && daysAgo(c.last_contact) > 30)
    .sort((a, b) => (a.last_contact ?? '').localeCompare(b.last_contact ?? ''))

  const overdueInvoices = allInvoices.filter((i) => i.status === 'overdue')
  const blockedTasks = allTasks.filter((t) => t.status === 'blocked')

  return {
    stats: {
      activeContacts: activeContacts.length,
      totalContacts: allContacts.length,
      openInvoices: openInvoices.length,
      outstanding,
      activeProjects: activeProjects.length,
      inProgressTasks: inProgressTasks.length,
      hoursThisWeek: Math.round(hoursThisWeek * 10) / 10
    },
    followUpNeeded,
    overdueInvoices,
    blockedTasks
  }
}

export const actions: Actions = {
  markContacted: async ({ request }) => {
    const data = await request.formData()
    const id = data.get('contactId')
    if (!id || typeof id !== 'string') return fail(400, { error: 'Missing contactId' })

    const today = new Date().toISOString().split('T')[0]
    const result = await E.runPromise(E.either(updateContact(id, { last_contact: today })))
    if (result._tag === 'Left') return fail(500, { error: 'Failed to update contact' })

    return { success: true }
  }
}
