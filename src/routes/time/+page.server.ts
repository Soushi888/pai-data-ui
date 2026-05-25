import { queryTimeEntries } from '$lib/server/index-db.js'
import type { TimeEntry } from '$lib/data/types.js'
import type { PageServerLoad } from './$types'

function getMonday(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1))
  return d.toISOString().split('T')[0]
}

function firstOfMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export const load: PageServerLoad = async ({ url }) => {
  const from = url.searchParams.get('from') ?? undefined
  const to = url.searchParams.get('to') ?? undefined
  const category = url.searchParams.get('category') ?? undefined
  const taskId = url.searchParams.get('task') ?? undefined
  const projectId = url.searchParams.get('project') ?? undefined

  const entries = queryTimeEntries({ dateFrom: from, dateTo: to, category, taskId, projectId }) as unknown as TimeEntry[]

  const allEntries = (from || to || category || taskId || projectId)
    ? (queryTimeEntries({}) as unknown as TimeEntry[])
    : entries

  const monday = getMonday()
  const monthStart = firstOfMonth()

  const totalHoursMonth = allEntries.filter(e => e.date >= monthStart).reduce((s, e) => s + e.hours_rounded, 0)
  const billableHoursMonth = allEntries.filter(e => e.date >= monthStart && e.category === 'billable').reduce((s, e) => s + e.hours_rounded, 0)
  const totalHoursWeek = allEntries.filter(e => e.date >= monday).reduce((s, e) => s + e.hours_rounded, 0)

  return {
    entries,
    stats: {
      totalHoursMonth: Math.round(totalHoursMonth * 10) / 10,
      billableHoursMonth: Math.round(billableHoursMonth * 10) / 10,
      totalHoursWeek: Math.round(totalHoursWeek * 10) / 10,
      count: entries.length,
    },
    filters: { from: from ?? '', to: to ?? '', category: category ?? '', taskId: taskId ?? '', projectId: projectId ?? '' },
  }
}
