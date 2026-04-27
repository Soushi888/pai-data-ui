<script lang="ts">
  import CategoryBadge from '$lib/components/erp/CategoryBadge.svelte'

  let { data } = $props()

  const cad = (n: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

  const MONTH_LABELS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  let yearFilter = $state<number | 'all'>(new Date().getFullYear())
  let categoryFilter = $state('all')
  let scopeFilter = $state('all')

  const CATEGORIES = ['all', 'housing', 'utilities', 'subscriptions', 'transport', 'food', 'health', 'other']
  const SCOPES = ['all', 'personal', 'freelance', 'mixed']

  const filtered = $derived(
    data.payments.filter((p) => {
      if (yearFilter !== 'all' && !p.date.startsWith(String(yearFilter))) return false
      if (categoryFilter !== 'all' && p.expense_category !== categoryFilter) return false
      if (scopeFilter !== 'all' && p.expense_scope !== scopeFilter) return false
      return true
    })
  )

  interface MonthGroup {
    ym: string
    label: string
    payments: typeof data.payments
    total: number
  }

  const monthGroups: MonthGroup[] = $derived.by(() => {
    const groups = new Map<string, typeof data.payments>()
    for (const p of filtered) {
      const ym = p.date.slice(0, 7)
      if (!groups.has(ym)) groups.set(ym, [])
      groups.get(ym)!.push(p)
    }
    return [...groups.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([ym, payments]) => {
        const [year, month] = ym.split('-')
        return {
          ym,
          label: `${MONTH_LABELS[parseInt(month) - 1]} ${year}`,
          payments,
          total: payments.reduce((sum, p) => sum + p.amount_cad, 0),
        }
      })
  })

  const filteredTotal = $derived(filtered.reduce((sum, p) => sum + p.amount_cad, 0))
</script>

<div class="p-6 max-w-5xl">
  <div class="flex items-center justify-between mb-1">
    <h1 class="text-xl font-semibold text-gray-100">Payment History</h1>
    <div class="flex items-center gap-4 text-sm text-gray-400">
      <span>All-time: <span class="text-gray-200">{cad(data.totalAllTime)}</span></span>
      <span>This year: <span class="text-gray-200">{cad(data.totalThisYear)}</span></span>
    </div>
  </div>
  <p class="text-sm text-gray-500 mb-4">{data.countAllTime} payment{data.countAllTime !== 1 ? 's' : ''} recorded</p>

  <div class="flex gap-2 mb-6">
    <select
      bind:value={yearFilter}
      class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500"
    >
      <option value="all">All years</option>
      {#each data.years as year}
        <option value={year}>{year}</option>
      {/each}
    </select>

    <select
      bind:value={categoryFilter}
      class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500"
    >
      {#each CATEGORIES as c}
        <option value={c}>{c === 'all' ? 'All categories' : c}</option>
      {/each}
    </select>

    <select
      bind:value={scopeFilter}
      class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500"
    >
      {#each SCOPES as s}
        <option value={s}>{s === 'all' ? 'All scopes' : s}</option>
      {/each}
    </select>

    {#if filtered.length !== data.payments.length}
      <span class="ml-2 text-sm text-gray-400 self-center">
        {filtered.length} result{filtered.length !== 1 ? 's' : ''} &middot; {cad(filteredTotal)}
      </span>
    {/if}
  </div>

  {#if monthGroups.length === 0}
    <p class="py-12 text-center text-gray-500 text-sm">No payments recorded for this period.</p>
  {:else}
    {#each monthGroups as group}
      <div class="flex items-center gap-3 mt-6 mb-2">
        <span class="text-sm font-medium text-gray-300">{group.label}</span>
        <div class="flex-1 h-px bg-gray-800"></div>
        <span class="text-sm tabular-nums text-gray-400">{cad(group.total)}</span>
      </div>

      <table class="w-full text-sm">
        <tbody>
          {#each group.payments as payment}
            <tr class="border-t border-gray-800/60 hover:bg-gray-800/30">
              <td class="py-2 pr-4 text-gray-500 tabular-nums w-28">{payment.date}</td>
              <td class="py-2 pr-4">
                <a
                  href="/erp/expenses/{payment.expense_id}"
                  class="text-blue-400 hover:underline"
                >{payment.expense_name}</a>
              </td>
              <td class="py-2 pr-4">
                <CategoryBadge category={payment.expense_category} />
              </td>
              <td class="py-2 pr-4 text-gray-500 text-xs">{payment.expense_scope}</td>
              {#if payment.currency_original !== 'CAD'}
                <td class="py-2 pr-4 text-gray-500 text-xs tabular-nums">
                  {payment.amount_original} {payment.currency_original}
                </td>
              {:else}
                <td class="py-2 pr-4"></td>
              {/if}
              <td class="py-2 text-right tabular-nums text-gray-200">{cad(payment.amount_cad)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/each}
  {/if}
</div>
