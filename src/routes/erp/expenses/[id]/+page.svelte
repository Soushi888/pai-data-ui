<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'

  let { data } = $props()

  const cad = (n: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

  let showPaymentForm = $state(false)

  const today = new Date().toISOString().split('T')[0]

  function diff(actual: number, expected: number): string {
    const d = actual - expected
    if (Math.abs(d) < 0.01) return ''
    return d > 0 ? `+${cad(d)}` : cad(d)
  }
</script>

<div class="p-6 max-w-3xl">
  <div class="flex items-center gap-2 mb-1">
    <a href="/erp/expenses" class="text-gray-500 hover:text-gray-300 text-sm">← Expenses</a>
  </div>

  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-100">{data.expense.name}</h1>
      <p class="text-sm text-gray-500 mt-0.5">{data.expense.id}</p>
    </div>
    <StatusBadge status={data.expense.status} />
  </div>

  <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-900 rounded border border-gray-800">
    <div>
      <p class="text-xs text-gray-500 mb-0.5">Category</p>
      <p class="text-sm text-gray-200">{data.expense.category}</p>
    </div>
    <div>
      <p class="text-xs text-gray-500 mb-0.5">Scope</p>
      <p class="text-sm text-gray-200">{data.expense.scope}</p>
    </div>
    <div>
      <p class="text-xs text-gray-500 mb-0.5">Recurrence</p>
      <p class="text-sm text-gray-200">{data.expense.recurrence}</p>
    </div>
    <div>
      <p class="text-xs text-gray-500 mb-0.5">Amount (CAD)</p>
      <p class="text-sm text-gray-200 tabular-nums">{cad(data.expense.amount_cad)}</p>
    </div>
    {#if data.expense.currency_original !== 'CAD'}
      <div>
        <p class="text-xs text-gray-500 mb-0.5">Original</p>
        <p class="text-sm text-gray-200 tabular-nums">{data.expense.amount_original} {data.expense.currency_original}</p>
      </div>
    {/if}
    {#if data.expense.recurrence === 'monthly' && data.expense.billing_day}
      <div>
        <p class="text-xs text-gray-500 mb-0.5">Billing Day</p>
        <p class="text-sm text-gray-200">Day {data.expense.billing_day}</p>
      </div>
    {/if}
    {#if data.expense.recurrence !== 'monthly' && data.expense.next_due}
      <div>
        <p class="text-xs text-gray-500 mb-0.5">Next Due</p>
        <p class="text-sm text-gray-200 tabular-nums">{data.expense.next_due}</p>
      </div>
    {/if}
    <div>
      <p class="text-xs text-gray-500 mb-0.5">Start Date</p>
      <p class="text-sm text-gray-200 tabular-nums">{data.expense.start_date}</p>
    </div>
    {#if data.expense.tags?.length}
      <div class="col-span-2">
        <p class="text-xs text-gray-500 mb-0.5">Tags</p>
        <div class="flex flex-wrap gap-1">
          {#each data.expense.tags as tag}
            <span class="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{tag}</span>
          {/each}
        </div>
      </div>
    {/if}
    {#if data.expense.notes}
      <div class="col-span-2">
        <p class="text-xs text-gray-500 mb-0.5">Notes</p>
        <p class="text-sm text-gray-400">{data.expense.notes}</p>
      </div>
    {/if}
  </div>

  <div class="flex items-center justify-between mb-3">
    <h2 class="text-sm font-semibold text-gray-300">Payment History</h2>
    {#if data.expense.status !== 'cancelled'}
      <button
        onclick={() => (showPaymentForm = !showPaymentForm)}
        class="px-3 py-1.5 rounded text-xs bg-green-700 hover:bg-green-600 text-white transition-colors"
      >
        + Record Payment
      </button>
    {/if}
  </div>

  {#if showPaymentForm}
    <form method="POST" action="?/recordPayment" class="mb-4 p-4 bg-gray-900 rounded border border-gray-700 grid grid-cols-2 gap-3">
      <h3 class="col-span-2 text-xs font-medium text-gray-400">Record Payment</h3>

      <input name="date" type="date" value={today} required class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <input name="amount_cad" type="number" step="0.01" value={data.expense.amount_cad} required placeholder="Amount (CAD)" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <select name="currency_original" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500">
        <option value="CAD" selected={data.expense.currency_original === 'CAD'}>CAD</option>
        <option value="USD" selected={data.expense.currency_original === 'USD'}>USD</option>
      </select>

      <input name="amount_original" type="number" step="0.01" value={data.expense.amount_original} placeholder="Amount (original currency)" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <div class="col-span-2">
        <input name="notes" placeholder="Notes (optional)" class="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />
      </div>

      <div class="col-span-2 flex gap-2 justify-end">
        <button type="button" onclick={() => (showPaymentForm = false)} class="px-3 py-1.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300">Cancel</button>
        <button type="submit" class="px-3 py-1.5 rounded text-xs bg-green-700 hover:bg-green-600 text-white">Record</button>
      </div>
    </form>
  {/if}

  <table class="w-full text-sm">
    <thead>
      <tr class="text-gray-500 text-left">
        <th class="pb-2 font-normal">Date</th>
        <th class="pb-2 font-normal text-right">Amount</th>
        <th class="pb-2 font-normal text-right">Diff</th>
        <th class="pb-2 font-normal">Notes</th>
      </tr>
    </thead>
    <tbody>
      {#each data.payments as pay}
        <tr class="border-t border-gray-800">
          <td class="py-2.5 text-gray-400 tabular-nums">{pay.date}</td>
          <td class="py-2.5 text-right tabular-nums text-gray-200">{cad(pay.amount_cad)}</td>
          <td class="py-2.5 text-right tabular-nums {(pay.amount_cad - data.expense.amount_cad) > 0.01 ? 'text-red-400' : (pay.amount_cad - data.expense.amount_cad) < -0.01 ? 'text-green-400' : 'text-gray-600'}">
            {diff(pay.amount_cad, data.expense.amount_cad)}
          </td>
          <td class="py-2.5 text-gray-500">{pay.notes ?? ''}</td>
        </tr>
      {:else}
        <tr><td colspan="4" class="py-8 text-center text-gray-500">No payments yet.</td></tr>
      {/each}
    </tbody>
  </table>

  {#if data.expense.status !== 'cancelled'}
    <div class="mt-8 pt-4 border-t border-gray-800">
      <form method="POST" action="?/cancel" onsubmit={(e) => { if (!confirm('Cancel this expense?')) e.preventDefault() }}>
        <button type="submit" class="text-xs text-red-500 hover:text-red-400 transition-colors">Cancel expense</button>
      </form>
    </div>
  {/if}
</div>
