import { Effect as E } from 'effect'
import { listInvoices } from '$lib/data/invoices.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const result = await E.runPromise(E.either(listInvoices()))
  const invoices = result._tag === 'Right' ? result.right : []
  invoices.sort((a, b) => b.issue_date.localeCompare(a.issue_date))
  const outstanding = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0)
  return { invoices, outstanding }
}
