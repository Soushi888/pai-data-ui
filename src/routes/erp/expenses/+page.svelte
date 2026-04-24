<script lang="ts">
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
    <form method="POST" action="?/create" class="mb-6 p-4 bg-gray-900 rounded border border-gray-700 grid grid-cols-2 gap-3">
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
      </select>

      <input name="billing_day" type="number" min="1" max="31" placeholder="Billing day (monthly)" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <input name="next_due" type="date" placeholder="Next due (annual/one-time)" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <input name="start_date" type="date" placeholder="Start date" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <input name="tags" placeholder="Tags (comma-separated)" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <div class="col-span-2 flex gap-2 justify-end">
        <button type="button" onclick={() => (showCreate = false)} class="px-3 py-1.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300">Cancel</button>
        <button type="submit" class="px-3 py-1.5 rounded text-xs bg-blue-600 hover:bg-blue-500 text-white">Create</button>
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

  <table class="w-full text-sm">
    <thead>
      <tr class="text-gray-500 text-left">
        <th class="pb-2 font-normal">Name</th>
        <th class="pb-2 font-normal">Category</th>
        <th class="pb-2 font-normal">Recurrence</th>
        <th class="pb-2 font-normal text-right">Amount</th>
        <th class="pb-2 font-normal">Next Due / Day</th>
        <th class="pb-2 font-normal">Status</th>
      </tr>
    </thead>
    <tbody>
      {#each filtered as exp}
        <tr
          class="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer"
          onclick={() => window.location.href = `/erp/expenses/${exp.id}`}
        >
          <td class="py-2.5 text-blue-400 font-medium">{exp.name}</td>
          <td class="py-2.5 text-gray-400">{exp.category}</td>
          <td class="py-2.5 text-gray-400">{exp.recurrence}</td>
          <td class="py-2.5 text-right tabular-nums text-gray-200">{amountLabel(exp)}</td>
          <td class="py-2.5 text-gray-500 tabular-nums">{nextDueLabel(exp)}</td>
          <td class="py-2.5"><StatusBadge status={exp.status} /></td>
        </tr>
      {:else}
        <tr><td colspan="6" class="py-8 text-center text-gray-500">No expenses.</td></tr>
      {/each}
    </tbody>
  </table>
</div>
