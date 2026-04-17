<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import TagList from '$lib/components/shared/TagList.svelte'
  import type { Opportunity } from '$lib/data/types.js'

  let { data } = $props()

  const columns: { status: Opportunity['status']; label: string }[] = [
    { status: 'prospect', label: 'Prospect' },
    { status: 'active', label: 'Active' },
    { status: 'won', label: 'Won' },
    { status: 'lost', label: 'Lost' },
    { status: 'on-hold', label: 'On Hold' }
  ]

  const cad = (n?: number) =>
    n != null ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n) : null
</script>

<div class="p-6">
  <h1 class="text-xl font-semibold text-gray-100 mb-6">Opportunities</h1>

  <div class="flex gap-4 overflow-x-auto pb-4">
    {#each columns as col}
      {@const cards = data.opportunities.filter((o) => o.status === col.status)}
      <div class="min-w-52 flex-1 bg-gray-900/50 rounded-lg p-3">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{col.label}</p>
          <span class="text-xs text-gray-600">{cards.length}</span>
        </div>
        {#each cards as opp}
          <a href="/crm/opportunities/{opp.id}" class="block bg-gray-800 rounded p-3 mb-2 hover:bg-gray-700 transition-colors">
            <p class="text-sm text-gray-200 font-medium mb-1">{opp.title}</p>
            <p class="text-xs text-gray-400 mb-1">{opp.organization}</p>
            {#if opp.value_cad}
              <p class="text-xs text-green-400 mb-1">{cad(opp.value_cad)}</p>
            {/if}
            <TagList tags={opp.tags ?? []} />
          </a>
        {:else}
          <p class="text-xs text-gray-600 text-center py-4">empty</p>
        {/each}
      </div>
    {/each}
  </div>
</div>
