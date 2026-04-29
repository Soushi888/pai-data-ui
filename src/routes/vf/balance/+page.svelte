<script lang="ts">
  let { data } = $props()

  const cad = (n: number | null) =>
    n == null ? '—' : new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)
</script>

<div class="p-6 max-w-3xl space-y-8">
  <div class="mb-2">
    <a href="/vf" class="text-xs text-gray-500 hover:text-gray-300">← VF Dashboard</a>
  </div>

  <h1 class="text-xl font-semibold text-gray-100">Economic Balance</h1>

  <!-- Summary cards -->
  <div class="grid grid-cols-2 gap-4">
    <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Outstanding Claims</p>
      <p class="text-2xl font-semibold tabular-nums text-orange-300">{cad(data.outstanding)}</p>
    </div>
    <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Settled Claims</p>
      <p class="text-2xl font-semibold tabular-nums text-green-300">{cad(data.settled)}</p>
    </div>
  </div>

  <!-- Work contributions -->
  <section>
    <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Work Contributions</h2>
    {#if data.contributions.length === 0}
      <p class="text-gray-600 text-sm">No work contributions recorded yet.</p>
    {:else}
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-500 text-left">
            <th class="pb-2 font-normal">Agent</th>
            <th class="pb-2 font-normal">Resource spec</th>
            <th class="pb-2 font-normal text-right">Total</th>
            <th class="pb-2 font-normal text-right">Events</th>
          </tr>
        </thead>
        <tbody>
          {#each data.contributions as c}
            <tr class="border-t border-gray-800">
              <td class="py-2 text-blue-400">{c.agent_id}</td>
              <td class="py-2 text-gray-400">{c.resource_spec ?? '—'}</td>
              <td class="py-2 text-right tabular-nums text-gray-200">
                {c.total_qty != null ? `${c.total_qty} ${c.qty_unit ?? ''}` : '—'}
              </td>
              <td class="py-2 text-right tabular-nums text-gray-500">{c.event_count}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>

  <!-- All claims detail -->
  <section>
    <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">All Claims</h2>
    <table class="w-full text-sm">
      <thead>
        <tr class="text-gray-500 text-left">
          <th class="pb-2 font-normal">Invoice</th>
          <th class="pb-2 font-normal">Client</th>
          <th class="pb-2 font-normal">Status</th>
          <th class="pb-2 font-normal text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {#each data.claims as c}
          <tr class="border-t border-gray-800 hover:bg-gray-800/40 cursor-pointer"
              onclick={() => window.location.href = `/erp/invoices/${c.id}`}>
            <td class="py-2 text-blue-400">{c.id}</td>
            <td class="py-2 text-gray-400">{c.client ?? '—'}</td>
            <td class="py-2">
              <span class="text-xs px-2 py-0.5 rounded-full
                {c.settlement_status === 'settled'
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-orange-900/50 text-orange-400'}">
                {c.settlement_status}
              </span>
            </td>
            <td class="py-2 text-right tabular-nums text-gray-200">{cad(c.claimed_amount)}</td>
          </tr>
        {:else}
          <tr><td colspan="4" class="py-8 text-center text-gray-600">No claims.</td></tr>
        {/each}
      </tbody>
    </table>
  </section>
</div>
