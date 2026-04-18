<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import KanbanColumn from '$lib/components/shared/KanbanColumn.svelte'
  import OpportunityCard from '$lib/components/crm/OpportunityCard.svelte'
  import type { Opportunity } from '$lib/data/types.js'
  import { invalidateAll } from '$app/navigation'

  let { data } = $props()

  type FilterTab = 'active' | 'all' | 'archived'
  let activeTab = $state<FilterTab>('active')

  const columns: { status: Opportunity['status']; label: string }[] = [
    { status: 'prospect', label: 'Prospect' },
    { status: 'active', label: 'Active' },
    { status: 'won', label: 'Won' },
    { status: 'lost', label: 'Lost' },
    { status: 'on-hold', label: 'On Hold' }
  ]

  const visibleOpps = $derived(
    activeTab === 'all'
      ? data.opportunities
      : activeTab === 'archived'
        ? data.opportunities.filter((o) => o.status === 'archived')
        : data.opportunities.filter((o) => o.status !== 'archived')
  )

  const cad = (n?: number) =>
    n != null ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n) : null

  let dragging = $state<string | null>(null)
  let hoveredCol = $state<string | null>(null)

  function dragstart(id: string) {
    dragging = id
  }

  function dragend() {
    dragging = null
    hoveredCol = null
  }

  async function drop(newStatus: Opportunity['status']) {
    if (!dragging) return
    await fetch(`/api/opportunities/${dragging}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    dragging = null
    await invalidateAll()
  }
</script>

<div class="p-6">
  <h1 class="text-xl font-semibold text-gray-100 mb-4">Opportunities</h1>

  <div class="flex gap-1 mb-6">
    {#each (['active', 'all', 'archived'] as const) as tab}
      <button
        onclick={() => (activeTab = tab)}
        class="px-3 py-1 text-xs rounded transition-colors
          {activeTab === tab
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}"
      >
        {tab === 'active' ? 'Active' : tab === 'all' ? 'All' : 'Archived'}
      </button>
    {/each}
  </div>

  {#if activeTab === 'archived'}
    <div class="space-y-2">
      {#each visibleOpps as opp}
        <a href="/crm/opportunities/{opp.id}" class="flex items-center gap-3 bg-gray-900/50 rounded p-3 hover:bg-gray-800 transition-colors">
          <span class="text-sm text-gray-300 flex-1">{opp.title}</span>
          <span class="text-xs text-gray-500">{opp.organization}</span>
          {#if opp.value_cad}
            <span class="text-xs text-green-400">{cad(opp.value_cad)}</span>
          {/if}
          <StatusBadge status={opp.status} />
        </a>
      {:else}
        <p class="text-xs text-gray-600 py-4">No archived opportunities.</p>
      {/each}
    </div>
  {:else}
    <div class="flex gap-4 overflow-x-auto pb-4">
      {#each columns as col}
        {@const cards = visibleOpps.filter((o) => o.status === col.status)}
        <div class="min-w-52 flex-1">
          <KanbanColumn
            label={col.label}
            count={cards.length}
            isHovered={hoveredCol === col.status}
            ondrop={() => drop(col.status)}
            ondragenter={() => (hoveredCol = col.status)}
            ondragleave={() => (hoveredCol = null)}
          >
            {#each cards as opp}
              <OpportunityCard
                {opp}
                {dragging}
                ondragstart={() => dragstart(opp.id)}
                ondragend={dragend}
              />
            {:else}
              <p class="text-xs text-gray-600 text-center py-4">empty</p>
            {/each}
          </KanbanColumn>
        </div>
      {/each}
    </div>
  {/if}
</div>
