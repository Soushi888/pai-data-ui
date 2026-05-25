import { queryTimeEntries } from '$lib/server/index-db.js'
import type { TimeEntry } from '$lib/data/types.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const sixMonthsAgo = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 6)
    return d.toISOString().split('T')[0]
  })()
  const thirtyDaysAgo = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })()

  const allEntries = queryTimeEntries({ dateFrom: sixMonthsAgo }) as unknown as TimeEntry[]

  // Hours by day (last 30 days)
  const recentEntries = allEntries.filter(e => e.date >= thirtyDaysAgo)
  const hoursByDayMap: Record<string, number> = {}
  for (const e of recentEntries) hoursByDayMap[e.date] = (hoursByDayMap[e.date] ?? 0) + e.hours_rounded
  const hoursByDay = Object.entries(hoursByDayMap).map(([date, hours]) => ({ date, hours: Math.round(hours * 10) / 10 })).sort((a, b) => a.date.localeCompare(b.date))

  // Hours by category
  const byCatMap: Record<string, number> = {}
  for (const e of allEntries) byCatMap[e.category] = (byCatMap[e.category] ?? 0) + e.hours_rounded
  const hoursByCategory = Object.entries(byCatMap).map(([category, hours]) => ({ category, hours: Math.round(hours * 10) / 10 })).sort((a, b) => b.hours - a.hours)

  // Hours by project (top 8)
  const byProjMap: Record<string, number> = {}
  for (const e of allEntries) byProjMap[e.project_id] = (byProjMap[e.project_id] ?? 0) + e.hours_rounded
  const hoursByProject = Object.entries(byProjMap).map(([project_id, hours]) => ({ project_id, label: project_id.replace('proj-', ''), hours: Math.round(hours * 10) / 10 })).sort((a, b) => b.hours - a.hours).slice(0, 8)

  // Hours by month (billable vs non-billable)
  const byMonthMap: Record<string, { billable: number; other: number }> = {}
  for (const e of allEntries) {
    const month = e.date.slice(0, 7)
    if (!byMonthMap[month]) byMonthMap[month] = { billable: 0, other: 0 }
    if (e.category === 'billable') byMonthMap[month].billable += e.hours_rounded
    else byMonthMap[month].other += e.hours_rounded
  }
  const hoursByMonth = Object.entries(byMonthMap).map(([month, v]) => ({ month, billable: Math.round(v.billable * 10) / 10, other: Math.round(v.other * 10) / 10 })).sort((a, b) => a.month.localeCompare(b.month))

  const totalHours = Math.round(allEntries.reduce((s, e) => s + e.hours_rounded, 0) * 10) / 10
  const billableHours = Math.round(allEntries.filter(e => e.category === 'billable').reduce((s, e) => s + e.hours_rounded, 0) * 10) / 10

  return { hoursByDay, hoursByCategory, hoursByProject, hoursByMonth, totalHours, billableHours }
}
