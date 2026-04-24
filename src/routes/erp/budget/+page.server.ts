import { Effect } from 'effect'
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
    Effect.runPromise(Effect.either(listExpenses())),
    Effect.runPromise(Effect.either(listPayments())),
    Effect.runPromise(Effect.either(listIncome())),
    Effect.runPromise(Effect.either(listInvoices()))
  ])

  const expenses = expR._tag === 'Right' ? expR.right : []
  const payments = payR._tag === 'Right' ? payR.right : []
  const income = incR._tag === 'Right' ? incR.right : []
  const invoices = invR._tag === 'Right' ? invR.right : []

  const currentYM = new Date().toISOString().slice(0, 7)

  // Summary cards
  const monthlyCommitted = expenses
    .filter((e) => e.status === 'active' && e.recurrence === 'monthly')
    .reduce((s, e) => s + e.amount_cad, 0)

  const actualThisMonth = payments
    .filter((p) => p.date.startsWith(currentYM))
    .reduce((s, p) => s + p.amount_cad, 0)

  const invoiceIncomeThisMonth = invoices
    .filter((i) => i.status === 'paid' && i.paid_date?.startsWith(currentYM))
    .reduce((s, i) => s + i.total, 0)

  const adHocIncomeThisMonth = income
    .filter((i) => i.date.startsWith(currentYM))
    .reduce((s, i) => s + i.amount_cad, 0)

  const incomeThisMonth = invoiceIncomeThisMonth + adHocIncomeThisMonth
  const netBalance = incomeThisMonth - actualThisMonth

  // Chart 1: income vs expenses per month (last 12)
  const months = last12Months()
  const expensesByMonth: { month: string; expenses: number; income: number }[] = months.map((m) => {
    const exp = payments.filter((p) => p.date.startsWith(m)).reduce((s, p) => s + p.amount_cad, 0)
    const invInc = invoices
      .filter((i) => i.status === 'paid' && i.paid_date?.startsWith(m))
      .reduce((s, i) => s + i.total, 0)
    const adHocInc = income.filter((i) => i.date.startsWith(m)).reduce((s, i) => s + i.amount_cad, 0)
    return { month: m, expenses: Math.round(exp * 100) / 100, income: Math.round((invInc + adHocInc) * 100) / 100 }
  })

  // Chart 2: expense by category (active monthly annualized)
  const categoryMap: Record<string, number> = {}
  for (const e of expenses.filter((e) => e.status === 'active' && e.recurrence === 'monthly')) {
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.amount_cad * 12
  }
  const expensesByCategory = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)

  // Chart 3: cost of living over time (all payments by month)
  const costByMonthMap: Record<string, number> = {}
  for (const p of payments) {
    const m = p.date.slice(0, 7)
    costByMonthMap[m] = (costByMonthMap[m] ?? 0) + p.amount_cad
  }
  const costOfLiving = Object.entries(costByMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }))

  // Chart 4: upcoming (next 6 months)
  const upcoming = expenses
    .filter((e) =>
      (e.recurrence === 'one-time' && e.status === 'planned') ||
      (e.recurrence === 'annual' && e.next_due != null && withinSixMonths(e.next_due))
    )
    .sort((a, b) => (a.next_due ?? '').localeCompare(b.next_due ?? ''))

  return {
    monthlyCommitted: Math.round(monthlyCommitted * 100) / 100,
    actualThisMonth: Math.round(actualThisMonth * 100) / 100,
    incomeThisMonth: Math.round(incomeThisMonth * 100) / 100,
    netBalance: Math.round(netBalance * 100) / 100,
    expensesByMonth,
    expensesByCategory,
    costOfLiving,
    upcoming,
    currentYM
  }
}
