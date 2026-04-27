<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import CarryToNewModal from './CarryToNewModal.svelte'
  import type { UnfinishedGroup, UnfinishedItem } from '$lib/data/types.js'

  export type Props = {
    initialGroups: UnfinishedGroup[];
  }

  let { initialGroups }: Props = $props()

  let show = $state(false)
  let groups = $state<UnfinishedGroup[]>(initialGroups)
  let selected = $state<Set<string>>(new Set())
  let loadingAll = $state(false)
  let allLoaded = $state(false)

  let showCarryModal = $state(false)
  let carryTargetDate = $state('')
  let carryExistingListId = $state<string | null>(null)

  const selectedItems = $derived(
    groups.flatMap((group) =>
      group.items
        .filter((item) => selected.has(`${group.listId}:${item.itemId}`))
        .map((item): UnfinishedItem => ({
          listId: group.listId,
          listDate: group.date,
          itemId: item.itemId,
          text: item.text,
          in_progress: item.in_progress,
          ...(item.linked_ref ? { linked_ref: item.linked_ref } : {}),
        }))
    )
  )

  function toggleItem(listId: string, itemId: string) {
    const key = `${listId}:${itemId}`
    const next = new Set(selected)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    selected = next
  }

  async function loadAll() {
    loadingAll = true
    const res = await fetch('/api/focus/unfinished?all=true')
    if (res.ok) {
      const data = await res.json()
      const existing = new Set(groups.map((g) => g.listId))
      const newGroups = (data.groups as UnfinishedGroup[]).filter(
        (g) => !existing.has(g.listId)
      )
      groups = [...groups, ...newGroups]
      allLoaded = true
    }
    loadingAll = false
  }

  function isoDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  async function openCarry(target: 'today' | 'tomorrow') {
    const d = new Date()
    if (target === 'tomorrow') d.setDate(d.getDate() + 1)
    const targetDate = isoDate(d)
    const targetId = `focus-daily-${targetDate}`
    const res = await fetch(`/api/focus/${targetId}`)
    carryTargetDate = targetDate
    carryExistingListId = res.ok ? targetId : null
    showCarryModal = true
  }

  function onCarried() {
    selected = new Set()
    invalidateAll()
  }
</script>

<div class="rounded-lg bg-gray-800/50 p-3">
  <button
    class="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300"
    onclick={() => (show = !show)}
  >
    <span>Unfinished Tasks</span>
    <span class="text-gray-600">{show ? '▲' : '▼'}</span>
  </button>

  {#if show}
    <div class="mt-3">
      {#if groups.length === 0}
        <p class="text-xs text-gray-600">No unfinished tasks in the last 7 days.</p>
      {:else}
        <div class="space-y-3">
          {#each groups as group}
            <div>
              <p class="mb-1 text-xs font-medium text-gray-500">{group.date}</p>
              <ul class="space-y-0.5">
                {#each group.items as item}
                  <li class="flex items-start gap-2 rounded px-2 py-1 hover:bg-gray-700/30">
                    <input
                      type="checkbox"
                      checked={selected.has(`${group.listId}:${item.itemId}`)}
                      onchange={() => toggleItem(group.listId, item.itemId)}
                      class="mt-0.5 accent-blue-500"
                    />
                    <span class="flex-1 text-xs text-gray-300">
                      {#if item.in_progress}
                        <span class="mr-1 text-amber-400">–</span>
                      {/if}
                      {item.text}
                    </span>
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>

        {#if !allLoaded}
          <button
            class="mt-3 text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50"
            onclick={loadAll}
            disabled={loadingAll}
          >
            {loadingAll ? 'Loading...' : 'Load full history'}
          </button>
        {/if}

        {#if selected.size > 0}
          <div class="mt-3 flex items-center gap-2 border-t border-gray-700/50 pt-3">
            <span class="flex-1 text-xs text-gray-500">{selected.size} selected</span>
            <button
              class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
              onclick={() => openCarry('today')}
            >
              Carry to today
            </button>
            <button
              class="rounded bg-blue-700 px-2 py-1 text-xs text-white hover:bg-blue-600"
              onclick={() => openCarry('tomorrow')}
            >
              Carry to tomorrow
            </button>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

{#if showCarryModal}
  <CarryToNewModal
    targetDate={carryTargetDate}
    existingListId={carryExistingListId}
    items={selectedItems}
    onClose={() => (showCarryModal = false)}
    onCarried={onCarried}
  />
{/if}
