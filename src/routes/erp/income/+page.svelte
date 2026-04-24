<script lang="ts">
  let { data } = $props()

  const cad = (n: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

  let showCreate = $state(false)
  const today = new Date().toISOString().split('T')[0]
</script>

<div class="p-6 max-w-3xl">
  <div class="flex items-center justify-between mb-1">
    <h1 class="text-xl font-semibold text-gray-100">Income</h1>
    <button
      onclick={() => (showCreate = !showCreate)}
      class="px-3 py-1.5 rounded text-xs bg-green-700 hover:bg-green-600 text-white transition-colors"
    >
      + Record Income
    </button>
  </div>
  <p class="text-sm text-gray-400 mb-4">
    This year: <span class="text-gray-200 font-medium">{cad(data.totalThisYear)}</span>
  </p>

  {#if showCreate}
    <form method="POST" action="?/create" class="mb-6 p-4 bg-gray-900 rounded border border-gray-700 grid grid-cols-2 gap-3">
      <h2 class="col-span-2 text-sm font-medium text-gray-300 mb-1">New Income Record</h2>

      <div class="col-span-2">
        <input name="name" required placeholder="Name (e.g. Federal tax return 2025)" class="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />
      </div>

      <select name="category" required class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500">
        <option value="">Category…</option>
        {#each ['tax-return', 'grant', 'salary', 'gift', 'other'] as c}
          <option value={c}>{c}</option>
        {/each}
      </select>

      <select name="scope" required class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500">
        <option value="personal">personal</option>
        <option value="freelance">freelance</option>
      </select>

      <input name="amount_cad" type="number" step="0.01" required placeholder="Amount (CAD)" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <select name="currency_original" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500">
        <option value="CAD">CAD</option>
        <option value="USD">USD</option>
      </select>

      <input name="date" type="date" value={today} required class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <input name="tags" placeholder="Tags (comma-separated)" class="bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />

      <div class="col-span-2">
        <input name="notes" placeholder="Notes (optional)" class="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500" />
      </div>

      <div class="col-span-2 flex gap-2 justify-end">
        <button type="button" onclick={() => (showCreate = false)} class="px-3 py-1.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300">Cancel</button>
        <button type="submit" class="px-3 py-1.5 rounded text-xs bg-green-700 hover:bg-green-600 text-white">Record</button>
      </div>
    </form>
  {/if}

  <table class="w-full text-sm">
    <thead>
      <tr class="text-gray-500 text-left">
        <th class="pb-2 font-normal">Name</th>
        <th class="pb-2 font-normal">Category</th>
        <th class="pb-2 font-normal">Scope</th>
        <th class="pb-2 font-normal">Date</th>
        <th class="pb-2 font-normal text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      {#each data.income as inc}
        <tr class="border-t border-gray-800">
          <td class="py-2.5 text-gray-200">{inc.name}</td>
          <td class="py-2.5 text-gray-400">{inc.category}</td>
          <td class="py-2.5 text-gray-500">{inc.scope}</td>
          <td class="py-2.5 text-gray-500 tabular-nums">{inc.date}</td>
          <td class="py-2.5 text-right tabular-nums text-green-300">{cad(inc.amount_cad)}</td>
        </tr>
      {:else}
        <tr><td colspan="5" class="py-8 text-center text-gray-500">No income records yet.</td></tr>
      {/each}
    </tbody>
  </table>
</div>
