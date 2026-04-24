<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'

  let { data } = $props()

  const cad = (n: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

  let statusFilter = $state('all')

  const filtered = $derived(
    statusFilter === 'all'
      ? data.invoices
      : data.invoices.filter((i) => i.status === statusFilter)
  )
</script>

<div class="p-6 max-w-5xl">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-xl font-semibold text-gray-100">Invoices</h1>
    <div class="flex items-center gap-3">
      {#if data.outstanding > 0}
        <span class="text-sm text-orange-400">Outstanding: {cad(data.outstanding)}</span>
      {/if}
      <a href="/erp/invoices/new" class="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded transition-colors">New Invoice</a>
    </div>
  </div>

  <div class="flex gap-1 mb-4">
    {#each ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'] as s}
      <button onclick={() => (statusFilter = s)}
        class="px-3 py-1.5 rounded text-xs transition-colors {statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
      >{s}</button>
    {/each}
  </div>

  <table class="w-full text-sm">
    <thead>
      <tr class="text-gray-500 text-left">
        <th class="pb-2 font-normal">Number</th>
        <th class="pb-2 font-normal">Organization</th>
        <th class="pb-2 font-normal">Status</th>
        <th class="pb-2 font-normal">Issued</th>
        <th class="pb-2 font-normal">Due</th>
        <th class="pb-2 font-normal text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      {#each filtered as inv}
        <tr class="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer" onclick={() => window.location.href = `/erp/invoices/${inv.id}`}>
          <td class="py-2.5 text-blue-400 font-medium">{inv.number}</td>
          <td class="py-2.5 text-gray-300">{inv.organization}</td>
          <td class="py-2.5"><StatusBadge status={inv.status} /></td>
          <td class="py-2.5 text-gray-500 tabular-nums">{inv.issue_date}</td>
          <td class="py-2.5 text-gray-500 tabular-nums">{inv.due_date}</td>
          <td class="py-2.5 text-right tabular-nums {inv.status === 'overdue' ? 'text-red-400' : 'text-gray-200'}">{cad(inv.total)}</td>
        </tr>
      {:else}
        <tr><td colspan="6" class="py-8 text-center text-gray-500">No invoices.</td></tr>
      {/each}
    </tbody>
  </table>
</div>
