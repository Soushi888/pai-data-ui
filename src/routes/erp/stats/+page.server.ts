import { Effect as E } from 'effect'
import { listExpenses } from '$lib/data/expenses.js'
import { listIncome } from '$lib/data/income.js'
import { listPayments } from '$lib/data/payments.js'
import { listInvoices } from '$lib/data/invoices.js'
import type { PageServerLoad } from './$types'

function last12Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

function withinSixMonths(dateStr: string): boolean {
  const target = new Date(dateStr)
  const now = new Date()
  const sixMonths = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate())
  return target >= now && target <= sixMonths
}

export const load: PageServerLoad = async () => {
  const [expR, payR, incR, invR] = await Promise.all([
    E.runPromise(E.either(listExpenses())),
    E.runPromise(E.either(listPayments())),
    E.runPromise(E.either(listIncome())),
    E.runPromise(E.either(listInvoices()))
  ])

  const expenses = expR._tag === 'Right' ? expR.right : []
  const payments = payR._tag === 'Right' ? payR.right : []
  const income = incR._tag === 'Right' ? incR.right : []
  const invoices = invR._tag === 'Right' ? invR.right : []

  const currentYear = new Date().getFullYear()
  const currentYM = new Date().toISOString().slice(0, 7)

  // ── Section 1: This Month ─────────────────────────────────────────────────
  const invoiceIncomeThisMonth = invoices
    .filter((i) => i.status === 'paid' && i.paid_date?.startsWith(currentYM))
    .reduce((s, i) => s + i.total, 0)

  const adHocIncomeThisMonth = income
    .filter((i) => i.date.startsWith(currentYM))
    .reduce((s, i) => s + i.amount_cad, 0)

  const incomeThisMonth = invoiceIncomeThisMonth + adHocIncomeThisMonth

  const actualThisMonth = payments
    .filter((p) => p.date.startsWith(currentYM))
    .reduce((s, p) => s + p.amount_cad, 0)

  const netBalance = incomeThisMonth - actualThisMonth
  const savingsRate = incomeThisMonth > 0 ? Math.round((netBalance / incomeThisMonth) * 100) : null

  const monthlyCommitted = expenses
    .filter((e) => e.status === 'active' && e.recurrence === 'monthly')
    .reduce((s, e) => s + e.amount_cad, 0)

  // ── Section 2: YTD / All-time ─────────────────────────────────────────────
  const ytdTotal = invoices
    .filter((i) => i.issue_date.startsWith(`${currentYear}`) && i.status === 'paid')
    .reduce((s, i) => s + i.total, 0)

  const grandTotal = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + i.total, 0)

  const byStatus: Record<string, number> = {}
  for (const inv of invoices) {
    byStatus[inv.status] = (byStatus[inv.status] ?? 0) + 1
  }

  // ── Section 3: Cash Flow (last 12 months) ─────────────────────────────────
  const cashFlowByMonth = last12Months().map((m) => {
    const exp = payments
      .filter((p) => p.date.startsWith(m))
      .reduce((s, p) => s + p.amount_cad, 0)
    const invInc = invoices
      .filter((i) => i.status === 'paid' && i.paid_date?.startsWith(m))
      .reduce((s, i) => s + i.total, 0)
    const adHocInc = income
      .filter((i) => i.date.startsWith(m))
      .reduce((s, i) => s + i.amount_cad, 0)
    return {
      month: m,
      expenses: Math.round(exp * 100) / 100,
      income: Math.round((invInc + adHocInc) * 100) / 100
    }
  })

  // ── Section 4: Revenue Breakdown ──────────────────────────────────────────
  const byMonth: Record<string, number> = {}
  for (const inv of invoices) {
    if (inv.status === 'cancelled') continue
    const month = inv.issue_date.slice(0, 7)
    byMonth[month] = (byMonth[month] ?? 0) + inv.total
  }
  const monthlyRevenue = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))

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

  // ── Section 5: Expense Breakdown ──────────────────────────────────────────
  const categoryMap: Record<string, number> = {}
  for (const e of expenses.filter((e) => e.status === 'active' && e.recurrence === 'monthly')) {
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.amount_cad * 12
  }
  const expensesByCategory = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)

  const costByMonthMap: Record<string, number> = {}
  for (const p of payments) {
    const m = p.date.slice(0, 7)
    costByMonthMap[m] = (costByMonthMap[m] ?? 0) + p.amount_cad
  }
  const costOfLiving = Object.entries(costByMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }))

  // ── Section 6: Upcoming ───────────────────────────────────────────────────
  const upcoming = expenses
    .filter(
      (e) =>
        (e.recurrence === 'one-time' && e.status === 'planned') ||
        (e.recurrence === 'annual' && e.next_due != null && withinSixMonths(e.next_due))
    )
    .sort((a, b) => (a.next_due ?? '').localeCompare(b.next_due ?? ''))

  return {
    incomeThisMonth: Math.round(incomeThisMonth * 100) / 100,
    actualThisMonth: Math.round(actualThisMonth * 100) / 100,
    netBalance: Math.round(netBalance * 100) / 100,
    savingsRate,
    monthlyCommitted: Math.round(monthlyCommitted * 100) / 100,
    ytdTotal: Math.round(ytdTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    totalInvoices: invoices.length,
    byStatus,
    currentYear,
    currentYM,
    cashFlowByMonth,
    monthlyRevenue,
    orgData,
    expensesByCategory,
    costOfLiving,
    upcoming
  }
}
