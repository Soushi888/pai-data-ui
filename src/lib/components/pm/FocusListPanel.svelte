<script lang="ts">
  /**
   * Panel displaying a focus list (daily or weekly) with item management.
   * @component
   */
  import { invalidateAll } from '$app/navigation'
  import FocusItem from './FocusItem.svelte'
  import PrepareNextModal from './PrepareNextModal.svelte'
  import type { FocusList, FocusItem as FocusItemType } from '$lib/data/types.js'

  export type Props = {
    /** The current focus list, or null if none exists yet. */
    list: FocusList | null;
    /** Unique identifier of the focus list used for API calls. */
    listId: string;
    /** Whether this is a daily or weekly focus list. */
    type: 'focus-daily' | 'focus-week';
    /** Human-readable label displayed in the panel header. */
    label: string;
    /** Optional callback invoked after a new list is created. */
    onCreated?: () => void;
  }

  let {
    list,
    listId,
    type,
    label,
    onCreated,
  }: Props = $props()

  let newItemText = $state('')
  let showPrepare = $state(false)
  let creating = $state(false)
  let addingItem = $state(false)

  // Local items for optimistic updates
  let localItems = $state<FocusItemType[]>(list?.items ?? [])
  $effect(() => { localItems = list?.items ?? [] })

  // DnD state
  let draggingId = $state<string | null>(null)
  let dragOverId = $state<string | null>(null)
  let dragPosition = $state<'above' | 'below' | null>(null)

  // Edit state
  let editingId = $state<string | null>(null)

  const doneCount = $derived(localItems.filter((i) => i.done).length)
  const inProgressCount = $derived(localItems.filter((i) => !i.done && i.in_progress).length)
  const totalCount = $derived(localItems.length)
  const isArchived = $derived(list?.status === 'archived')

  const dateLabel = $derived(() => {
    if (!list) return label
    if ('date' in list) return list.date
    if ('week' in list) return list.week
    return label
  })

  async function createList() {
    creating = true
    await fetch('/api/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    await invalidateAll()
    creating = false
    onCreated?.()
  }

  function cycleItem(i: FocusItemType): FocusItemType {
    if (i.done) return { ...i, done: false, in_progress: false }
    if (i.in_progress) return { ...i, done: true, in_progress: false }
    return { ...i, done: false, in_progress: true }
  }

  async function toggleItem(itemId: string) {
    if (!list) return
    const updated = localItems.map((i) => i.id === itemId ? cycleItem(i) : i)
    localItems = updated
    await fetch(`/api/focus/${listId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: updated }),
    })
    await invalidateAll()
  }

  async function addItem(e: Event) {
    e.preventDefault()
    if (!list || !newItemText.trim()) return
    addingItem = true
    const updated = [
      ...localItems,
      { id: `item-${localItems.length + 1}`, text: newItemText.trim(), done: false },
    ]
    await fetch(`/api/focus/${listId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: updated }),
    })
    newItemText = ''
    await invalidateAll()
    addingItem = false
  }

  // --- DnD handlers ---

  function dragStart(id: string) {
    draggingId = id
    editingId = null
  }

  function dragEnd() {
    draggingId = null
    dragOverId = null
    dragPosition = null
  }

  function dragOver(id: string, position: 'above' | 'below') {
    dragOverId = id
    dragPosition = position
  }

  async function drop() {
    if (!list || !draggingId || !dragOverId || draggingId === dragOverId) {
      dragEnd()
      return
    }

    const items = [...localItems]
    const fromIdx = items.findIndex((i) => i.id === draggingId)
    const toIdx = items.findIndex((i) => i.id === dragOverId)
    if (fromIdx === -1 || toIdx === -1) { dragEnd(); return }

    const [moved] = items.splice(fromIdx, 1)
    // After splice, toIdx may have shifted if fromIdx < toIdx
    const adjustedTo = fromIdx < toIdx ? toIdx - 1 : toIdx
    const insertAt = dragPosition === 'above' ? adjustedTo : adjustedTo + 1
    items.splice(insertAt, 0, moved)

    const prevItems = localItems
    localItems = items
    dragEnd()

    const res = await fetch(`/api/focus/${listId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    if (!res.ok) localItems = prevItems
  }

  // --- Edit handlers ---

  function startEdit(id: string) {
    editingId = id
  }

  async function saveEdit(id: string, text: string) {
    if (!list) return
    editingId = null
    const updated = localItems.map((i) => i.id === id ? { ...i, text } : i)
    localItems = updated
    await fetch(`/api/focus/${listId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: updated }),
    })
    await invalidateAll()
  }

  function cancelEdit() {
    editingId = null
  }
</script>

<div class="flex flex-col gap-3 rounded-lg bg-gray-800 p-4">
  <header class="flex items-center justify-between">
    <div>
      <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      <h2 class="text-sm font-medium text-gray-200">{dateLabel()}</h2>
    </div>
    {#if list}
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400">
          {doneCount}/{totalCount}{#if inProgressCount > 0} · <span class="text-amber-400">{inProgressCount} in progress</span>{/if}
        </span>
        {#if isArchived}
          <span class="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-500">archived</span>
        {:else}
          <button
            class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
            onclick={() => (showPrepare = true)}
          >
            Prepare next
          </button>
        {/if}
      </div>
    {/if}
  </header>

  {#if !list}
    <div class="flex flex-col items-center gap-3 py-6 text-center">
      <p class="text-sm text-gray-500">No {label.toLowerCase()} list yet.</p>
      <button
        class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
        onclick={createList}
        disabled={creating}
      >
        {creating ? 'Creating...' : `Start ${label.toLowerCase()} focus`}
      </button>
    </div>
  {:else}
    <ul class="space-y-0.5">
      {#if localItems.length === 0}
        <li class="py-2 text-center text-xs text-gray-600">No items yet</li>
      {/if}
      {#each localItems as item (item.id)}
        <FocusItem
          {item}
          onToggle={toggleItem}
          disabled={isArchived}
          {draggingId}
          {dragOverId}
          {dragPosition}
          onDragStart={dragStart}
          onDragEnd={dragEnd}
          onDragOver={dragOver}
          onDrop={drop}
          editing={editingId === item.id}
          onEditStart={startEdit}
          onEditSave={saveEdit}
          onEditCancel={cancelEdit}
        />
      {/each}
    </ul>

    {#if !isArchived}
      <form onsubmit={addItem} class="flex gap-2">
        <input
          bind:value={newItemText}
          placeholder="Add item... (use [[ref]] to link)"
          class="flex-1 rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          class="rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-600 disabled:opacity-50"
          disabled={addingItem || !newItemText.trim()}
        >
          Add
        </button>
      </form>
    {/if}

    {#if list.carried_from}
      <p class="text-xs text-gray-600">Carried from: <a href="/pm/focus/{list.carried_from}" class="text-gray-500 hover:text-gray-400">{list.carried_from}</a></p>
    {/if}
  {/if}
</div>

{#if showPrepare && list}
  <PrepareNextModal {list} onClose={() => (showPrepare = false)} />
{/if}
