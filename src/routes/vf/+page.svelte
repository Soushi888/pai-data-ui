<script lang="ts">
  let { data } = $props()

  const cad = (n: number | null) =>
    n == null ? '—' : new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

  const ACTION_COLORS: Record<string, string> = {
    work: 'text-blue-400',
    'deliver-service': 'text-blue-300',
    use: 'text-amber-400',
    consume: 'text-orange-400',
    produce: 'text-green-400',
    receive: 'text-emerald-400',
    transfer: 'text-purple-400',
    cite: 'text-gray-400',
  }

  function actionColor(action: string) {
    return ACTION_COLORS[action] ?? 'text-gray-400'
  }
</script>

<div class="p-6 max-w-5xl space-y-8">
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-semibold text-gray-100">ValueFlows Dashboard</h1>
    <a href="/vf/balance" class="text-xs text-blue-400 hover:text-blue-300 transition-colors">Balance sheet →</a>
  </div>

  <!-- Outstanding claims banner -->
  {#if data.outstanding > 0}
    <div class="bg-orange-950/40 border border-orange-800/50 rounded-lg px-4 py-3 flex items-center justify-between">
      <span class="text-sm text-orange-300">Outstanding claims</span>
      <span class="text-orange-200 font-semibold tabular-nums">{cad(data.outstanding)}</span>
    </div>
  {/if}

  <!-- Contributions summary -->
  <section>
    <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Agent Contributions</h2>
    {#if data.contributions.length === 0}
      <p class="text-gray-600 text-sm">No contributions tracked yet.</p>
    {:else}
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-500 text-left">
            <th class="pb-2 font-normal">Agent</th>
            <th class="pb-2 font-normal">Resource spec</th>
            <th class="pb-2 font-normal text-right">Total qty</th>
            <th class="pb-2 font-normal text-right">Events</th>
          </tr>
        </thead>
        <tbody>
          {#each data.contributions as c}
            <tr class="border-t border-gray-800">
              <td class="py-2 text-blue-400">
                <a href="/vf/agent/{c.agent_id}" class="hover:text-blue-300">{c.agent_id}</a>
              </td>
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

  <!-- Claims status -->
  <section>
    <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Claims</h2>
    {#if data.claims.length === 0}
      <p class="text-gray-600 text-sm">No claims.</p>
    {:else}
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
          {/each}
        </tbody>
      </table>
    {/if}
  </section>

  <!-- Recent events -->
  <section>
    <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Events</h2>
    {#if data.recentEvents.length === 0}
      <p class="text-gray-600 text-sm">No events.</p>
    {:else}
      <div class="space-y-1">
        {#each data.recentEvents as e}
          <div class="flex items-center gap-3 text-sm border-t border-gray-800/60 py-2">
            <span class="w-28 font-mono text-xs {actionColor(e.action)}">{e.action}</span>
            <span class="text-gray-400 truncate max-w-xs">{e.id.replace(/^(task|exp|inc)-/, '')}</span>
            {#if e.process_title}
              <a href="/vf/process/{e.input_of}/flow"
                 class="text-gray-500 hover:text-gray-300 text-xs truncate max-w-[160px]"
                 onclick={(ev) => ev.stopPropagation()}>
                ↳ {e.process_title}
              </a>
            {/if}
            <span class="ml-auto text-gray-600 tabular-nums text-xs shrink-0">{e.point_in_time ?? ''}</span>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
