import { Effect } from 'effect'
import { listContacts } from '$lib/data/contacts.js'
import { listInvoices } from '$lib/data/invoices.js'
import { listProjects } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import type { PageServerLoad } from './$types'

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
    Effect.runPromise(Effect.either(listContacts())),
    Effect.runPromise(Effect.either(listInvoices())),
    Effect.runPromise(Effect.either(listProjects())),
    Effect.runPromise(Effect.either(listTasks()))
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
  const hoursThisWeek = allTasks.reduce((sum, t) =>
    sum + (t.time_logs ?? []).filter((l) => l.date >= monday).reduce((s, l) => s + l.hours, 0), 0)

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
