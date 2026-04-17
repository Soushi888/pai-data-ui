import { Effect } from 'effect'
import { listInvoices } from '$lib/data/invoices.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const result = await Effect.runPromise(Effect.either(listInvoices()))
  const invoices = result._tag === 'Right' ? result.right : []

  const currentYear = new Date().getFullYear()
  const ytdInvoices = invoices.filter(
    (i) => i.issue_date.startsWith(`${currentYear}`) && i.status === 'paid'
  )

  // Monthly totals (all years, sorted)
  const byMonth: Record<string, number> = {}
  for (const inv of invoices) {
    if (inv.status === 'cancelled') continue
    const month = inv.issue_date.slice(0, 7) // YYYY-MM
    byMonth[month] = (byMonth[month] ?? 0) + inv.total
  }
  const monthlyData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))

  // Per-organization totals (paid only)
  const byOrg: Record<string, { total: number; count: number }> = {}
  for (const inv of invoices) {
    if (inv.status === 'cancelled') continue
    const org = inv.organization
    byOrg[org] = byOrg[org] ?? { total: 0, count: 0 }
    byOrg[org].total += inv.total
    byOrg[org].count += 1
  }
  const orgData = Object.entries(byOrg)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([org, { total, count }]) => ({ org, total: Math.round(total * 100) / 100, count }))

  // Status breakdown
  const byStatus: Record<string, number> = {}
  for (const inv of invoices) {
    byStatus[inv.status] = (byStatus[inv.status] ?? 0) + 1
  }

  // YTD
  const ytdTotal = ytdInvoices.reduce((s, i) => s + i.total, 0)

  // Grand total (all paid)
  const allPaid = invoices.filter((i) => i.status === 'paid')
  const grandTotal = allPaid.reduce((s, i) => s + i.total, 0)

  return {
    monthlyData,
    orgData,
    byStatus,
    ytdTotal: Math.round(ytdTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    totalInvoices: invoices.length,
    currentYear
  }
}
