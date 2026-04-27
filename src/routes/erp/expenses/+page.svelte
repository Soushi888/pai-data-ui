<script lang="ts">
  import { goto } from '$app/navigation'
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'

  let { data } = $props()

  const cad = (n: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

  let statusFilter = $state('all')
  let scopeFilter = $state('all')
  let showCreate = $state(false)

  const filtered = $derived(
    data.expenses.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (scopeFilter !== 'all' && e.scope !== scopeFilter) return false
      return true
    })
  )

  const recurring = $derived(filtered.filter((e) => e.recurrence === 'monthly' || e.recurrence === 'annual'))
  const oneTime   = $derived(filtered.filter((e) => e.recurrence === 'one-time'))

  const monthlyTotal = $derived(
    recurring.reduce((sum, e) => sum + (e.recurrence === 'annual' ? e.amount_cad / 12 : e.amount_cad), 0)
  )
  const annualTotal = $derived(
    recurring.reduce((sum, e) => sum + (e.recurrence === 'monthly' ? e.amount_cad * 12 : e.amount_cad), 0)
  )

  function nextDueLabel(e: typeof data.expenses[0]): string {
    if (e.recurrence === 'monthly') {
      return e.billing_day ? `Day ${e.billing_day}` : ''
    }
    return e.next_due ?? ''
  }

  function amountLabel(e: typeof data.expenses[0]): string {
    if (e.currency_original !== 'CAD') {
      return `${cad(e.amount_cad)} (${e.amount_original} ${e.currency_original})`
    }
    return cad(e.amount_cad)
  }

  let saving = $state(false)

  async function submitCreate(e: Event) {
    e.preventDefault()
    saving = true
    const fd = new FormData(e.target as HTMLFormElement)
    const recurrence = fd.get('recurrence') as string
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        category: fd.get('category'),
        scope: fd.get('scope'),
        recurrence,
        status: fd.get('status') || 'active',
        amount_cad: parseFloat(fd.get('amount_cad') as string),
        currency_original: fd.get('currency_original') || 'CAD',
        billing_day: recurrence === 'monthly' && fd.get('billing_day') ? parseInt(fd.get('billing_day') as string) : null,
        next_due: recurrence !== 'monthly' ? fd.get('next_due') || null : null,
        start_date: fd.get('start_date') || null,
        tags: ((fd.get('tags') as string) || '').split(',').map(t => t.trim()).filter(Boolean)
      })
    })
    const json = await res.json()
    if (json.expense?.id) goto(`/erp/expenses/${json.expense.id}`)
    saving = false
  }
</script>

<div class="p-6 max-w-5xl">
  <div class="flex items-center justify-between mb-1">
    <h1 class="text-xl font-semibold text-gray-100">Expenses</h1>
    <button
      onclick={() => (showCreate = !showCreate)}
      class="px-3 py-1.5 rounded text-xs bg-blue-600 hover:bg-blue-500 text-white transition-colors"
    >
      + Add Expense
    </button>
  </div>
  <p class="text-sm text-gray-400 mb-4">
    Monthly committed: <span class="text-gray-200 font-medium">{cad(data.monthlyCommitted)}</span>
  </p>

  {#if showCreate}
    <form onsubmit={submitCreate} class="mb-6 p-4 bg-gray-900 rounded border border-gray-700 grid grid-cols-2 gap-3">
      <h2 class="col-span-2 text-sm font-medium text-gray-300 mb-1">New Expense</h2>

      <div class="col-span-2">
        <input name="name" required placeholder="Name" class="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />
      </div>

      <select name="category" required class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500">
        <option value="">Category…</option>
        {#each ['housing','utilities','subscriptions','transport','food','health','other'] as c}
          <option value={c}>{c}</option>
        {/each}
      </select>

      <select name="scope" required class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500">
        <option value="personal">personal</option>
        <option value="freelance">freelance</option>
        <option value="mixed">mixed</option>
      </select>

      <select name="recurrence" required class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500">
        <option value="monthly">monthly</option>
        <option value="annual">annual</option>
        <option value="one-time">one-time</option>
      </select>

      <select name="status" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500">
        <option value="active">active</option>
        <option value="planned">planned</option>
      </select>

      <input name="amount_cad" type="number" step="0.01" required placeholder="Amount (CAD)" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <select name="currency_original" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500">
        <option value="CAD">CAD</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>

      <input name="billing_day" type="number" min="1" max="31" placeholder="Billing day (monthly)" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <input name="next_due" type="date" placeholder="Next due (annual/one-time)" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <input name="start_date" type="date" placeholder="Start date" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <input name="tags" placeholder="Tags (comma-separated)" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <div class="col-span-2 flex gap-2 justify-end">
        <button type="button" onclick={() => (showCreate = false)} class="px-3 py-1.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300">Cancel</button>
        <button type="submit" disabled={saving} class="px-3 py-1.5 rounded text-xs bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create'}</button>
      </div>
    </form>
  {/if}

  <div class="flex gap-4 mb-4">
    <div class="flex gap-1">
      {#each ['all', 'active', 'planned', 'cancelled'] as s}
        <button onclick={() => (statusFilter = s)}
          class="px-3 py-1.5 rounded text-xs transition-colors {statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
        >{s}</button>
      {/each}
    </div>
    <div class="flex gap-1">
      {#each ['all', 'personal', 'freelance', 'mixed'] as s}
        <button onclick={() => (scopeFilter = s)}
          class="px-3 py-1.5 rounded text-xs transition-colors {scopeFilter === s ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
        >{s}</button>
      {/each}
    </div>
  </div>

  <!-- Recurring section -->
  <div class="flex items-center gap-3 mb-2">
    <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Recurring</span>
    <div class="flex-1 h-px bg-gray-800"></div>
    <span class="text-xs text-gray-500">
      <span class="text-gray-300">{cad(monthlyTotal)}</span>/mo
      &middot;
      <span class="text-gray-300">{cad(annualTotal)}</span>/yr
    </span>
  </div>

  <table class="w-full text-sm mb-8">
    <thead>
      <tr class="text-gray-500 text-left">
        <th class="pb-2 font-normal">Name</th>
        <th class="pb-2 font-normal">Category</th>
        <th class="pb-2 font-normal">Cycle</th>
        <th class="pb-2 font-normal text-right">Amount</th>
        <th class="pb-2 font-normal">Billing</th>
        <th class="pb-2 font-normal">Status</th>
      </tr>
    </thead>
    <tbody>
      {#each recurring as exp}
        <tr
          class="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer"
          onclick={() => window.location.href = `/erp/expenses/${exp.id}`}
        >
          <td class="py-2.5 text-blue-400 font-medium">{exp.name}</td>
          <td class="py-2.5 text-gray-400">{exp.category}</td>
          <td class="py-2.5">
            <span class="px-2 py-0.5 rounded text-xs {exp.recurrence === 'monthly' ? 'bg-blue-900/50 text-blue-300' : 'bg-yellow-900/50 text-yellow-300'}">{exp.recurrence}</span>
          </td>
          <td class="py-2.5 text-right tabular-nums text-gray-200">{amountLabel(exp)}</td>
          <td class="py-2.5 text-gray-500 tabular-nums">{nextDueLabel(exp)}</td>
          <td class="py-2.5"><StatusBadge status={exp.status} /></td>
        </tr>
      {:else}
        <tr><td colspan="6" class="py-8 text-center text-gray-500">No recurring expenses.</td></tr>
      {/each}
    </tbody>
  </table>

  <!-- Variable & One-time section -->
  <div class="flex items-center gap-3 mb-2">
    <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Variable & One-time</span>
    <div class="flex-1 h-px bg-gray-800"></div>
    <span class="text-xs text-gray-500">{oneTime.length} item{oneTime.length !== 1 ? 's' : ''}</span>
  </div>

  <table class="w-full text-sm">
    <thead>
      <tr class="text-gray-500 text-left">
        <th class="pb-2 font-normal">Name</th>
        <th class="pb-2 font-normal">Category</th>
        <th class="pb-2 font-normal text-right">Amount</th>
        <th class="pb-2 font-normal">Next Due</th>
        <th class="pb-2 font-normal">Status</th>
      </tr>
    </thead>
    <tbody>
      {#each oneTime as exp}
        <tr
          class="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer"
          onclick={() => window.location.href = `/erp/expenses/${exp.id}`}
        >
          <td class="py-2.5 text-blue-400 font-medium">{exp.name}</td>
          <td class="py-2.5 text-gray-400">{exp.category}</td>
          <td class="py-2.5 text-right tabular-nums text-gray-200">{amountLabel(exp)}</td>
          <td class="py-2.5 text-gray-500 tabular-nums">{exp.next_due ?? ''}</td>
          <td class="py-2.5"><StatusBadge status={exp.status} /></td>
        </tr>
      {:else}
        <tr><td colspan="5" class="py-8 text-center text-gray-500">No one-time expenses.</td></tr>
      {/each}
    </tbody>
  </table>
</div>
