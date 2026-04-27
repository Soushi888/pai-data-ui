<script lang="ts">
  /**
   * Modal for preparing the next focus period by reviewing unfinished items.
   * @component
   */
  import { invalidateAll } from '$app/navigation'
  import type { FocusItem, FocusList } from '$lib/data/types.js'

  export type Props = {
    /** The current focus list whose unfinished items will be reviewed. */
    list: FocusList;
    /** Callback to close the modal. */
    onClose: () => void;
  }

  let {
    list,
    onClose,
  }: Props = $props()

  type Decision = 'carry' | 'drop' | 'archive'
  const unchecked = $derived(list.items.filter((i) => !i.done))
  let decisions = $state<Record<string, Decision>>(
    Object.fromEntries(unchecked.map((i) => [i.id, 'carry']))
  )
  let saving = $state(false)

  const isDaily = list.type === 'focus-daily'

  async function confirm() {
    saving = true

    const toArchive = unchecked.filter((i) => decisions[i.id] === 'archive')
    const toCarry = unchecked.filter((i) => decisions[i.id] === 'carry')

    const updatedItems = list.items.map((item) => {
      if (toArchive.some((a) => a.id === item.id)) return { ...item, done: true }
      return item
    })

    await fetch(`/api/focus/${list.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: updatedItems, ...(isDaily ? { status: 'archived' } : {}) }),
    })

    if (toCarry.length > 0) {
      const carriedItems: FocusItem[] = toCarry.map((item, idx) => ({
        id: `item-${idx + 1}`,
        text: item.text,
        done: false,
        ...(item.linked_ref ? { linked_ref: item.linked_ref } : {}),
      }))

      await fetch('/api/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: list.type,
          ...(isDaily && 'date' in list ? { date: nextDate(list.date) } : {}),
          ...(!isDaily && 'week' in list ? { week: nextWeek(list.week) } : {}),
          items: carriedItems,
          carried_from: list.id,
        }),
      })
    }

    await invalidateAll()
    saving = false
    onClose()
  }

  function nextDate(date: string): string {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  function nextWeek(week: string): string {
    const [year, w] = week.split('-W').map(Number)
    if (w === 52 || w === 53) return `${year + 1}-W01`
    return `${year}-W${String(w + 1).padStart(2, '0')}`
  }

  const label = isDaily ? 'tomorrow' : 'next week'
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onclick={onClose}>
  <div
    class="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl"
    onclick={(e) => e.stopPropagation()}
  >
    <h2 class="mb-1 text-base font-semibold text-gray-100">Prepare {label}</h2>
    <p class="mb-4 text-xs text-gray-400">For each unfinished item, choose what to do.</p>

    {#if unchecked.length === 0}
      <p class="text-sm text-gray-400">All items are done. Nothing to carry forward.</p>
    {:else}
      <ul class="mb-4 space-y-2">
        {#each unchecked as item}
          <li class="rounded bg-gray-700/50 p-3">
            <p class="mb-2 text-sm text-gray-200">{item.text}</p>
            <div class="flex gap-2">
              {#each ['carry', 'drop', 'archive'] as action}
                <button
                  class="rounded px-2 py-1 text-xs transition-colors
                    {decisions[item.id] === action
                      ? action === 'carry' ? 'bg-blue-600 text-white'
                        : action === 'archive' ? 'bg-green-700 text-white'
                        : 'bg-gray-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}"
                  onclick={() => (decisions[item.id] = action as Decision)}
                >
                  {action === 'carry' ? 'Carry' : action === 'drop' ? 'Drop' : 'Archive'}
                </button>
              {/each}
            </div>
          </li>
        {/each}
      </ul>
    {/if}

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
