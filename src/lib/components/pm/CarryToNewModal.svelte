<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import type { UnfinishedItem } from '$lib/data/types.js'

  export type Props = {
    targetDate: string;
    existingListId: string | null;
    items: UnfinishedItem[];
    onClose: () => void;
    onCarried: () => void;
  }

  let { targetDate, existingListId, items, onClose, onCarried }: Props = $props()

  let saving = $state(false)

  async function confirm() {
    saving = true

    if (existingListId) {
      const res = await fetch(`/api/focus/${existingListId}`)
      const { list: existing } = await res.json()
      const maxN = (existing.items as { id: string }[]).reduce((max, item) => {
        const m = item.id.match(/^item-(\d+)$/)
        return m ? Math.max(max, parseInt(m[1], 10)) : max
      }, 0)
      const newItems = [
        ...existing.items,
        ...items.map((item, idx) => ({
          id: `item-${maxN + idx + 1}`,
          text: item.text,
          done: false,
          ...(item.linked_ref ? { linked_ref: item.linked_ref } : {}),
        })),
      ]
      await fetch(`/api/focus/${existingListId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems }),
      })
    } else {
      const sources = new Set(items.map((i) => i.listId))
      const carried_from = sources.size === 1 ? [...sources][0] : ''
      const carriedItems = items.map((item, idx) => ({
        id: `item-${idx + 1}`,
        text: item.text,
        done: false,
        ...(item.linked_ref ? { linked_ref: item.linked_ref } : {}),
      }))
      await fetch('/api/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'focus-daily',
          date: targetDate,
          items: carriedItems,
          ...(carried_from ? { carried_from } : {}),
        }),
      })
    }

    await invalidateAll()
    saving = false
    onCarried()
    onClose()
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onclick={onClose}>
  <div
    class="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl"
    onclick={(e) => e.stopPropagation()}
  >
    <h2 class="mb-1 text-base font-semibold text-gray-100">Carry to {targetDate}</h2>
    <p class="mb-4 text-xs text-gray-400">
      {existingListId ? 'Append to existing' : 'Create new'} focus list with {items.length} item{items.length !== 1 ? 's' : ''}.
    </p>

    <ul class="mb-4 max-h-60 space-y-1 overflow-y-auto">
      {#each items as item}
        <li class="rounded bg-gray-700/50 px-3 py-2 text-sm text-gray-200">
          {#if item.in_progress}
            <span class="mr-1 text-amber-400">–</span>
          {/if}
          {item.text}
          <span class="ml-1 text-xs text-gray-500">({item.listDate})</span>
        </li>
      {/each}
    </ul>

    <div class="flex justify-end gap-2">
      <button
        class="rounded px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200"
        onclick={onClose}
      >
        Cancel
      </button>
      <button
        class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
        onclick={confirm}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Confirm'}
      </button>
    </div>
  </div>
</div>
