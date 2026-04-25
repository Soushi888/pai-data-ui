<script lang="ts">
  import WikiLink from './WikiLink.svelte'
  import type { FocusItem } from '$lib/data/types.js'

  let {
    item,
    onToggle,
    draggingId = null,
    dragOverId = null,
    dragPosition = null,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    editing = false,
    onEditStart,
    onEditSave,
    onEditCancel,
    disabled = false,
  }: {
    item: FocusItem
    onToggle: (itemId: string) => void
    draggingId?: string | null
    dragOverId?: string | null
    dragPosition?: 'above' | 'below' | null
    onDragStart?: (id: string) => void
    onDragEnd?: () => void
    onDragOver?: (id: string, position: 'above' | 'below') => void
    onDrop?: () => void
    editing?: boolean
    onEditStart?: (id: string) => void
    onEditSave?: (id: string, text: string) => void
    onEditCancel?: () => void
    disabled?: boolean
  } = $props()

  let editText = $state(item.text)
  let inputEl = $state<HTMLInputElement | null>(null)

  $effect(() => {
    if (editing) {
      editText = item.text
      inputEl?.focus()
      inputEl?.select()
    }
  })

  function handleDragOver(e: DragEvent) {
    if (!onDragOver || disabled) return
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onDragOver(item.id, e.clientY < rect.top + rect.height / 2 ? 'above' : 'below')
  }

  function handleEditKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onEditSave?.(item.id, editText.trim() || item.text)
    } else if (e.key === 'Escape') {
      onEditCancel?.()
    }
  }

  const isDragging = $derived(draggingId === item.id)
  const showAbove = $derived(dragOverId === item.id && dragPosition === 'above' && !isDragging)
  const showBelow = $derived(dragOverId === item.id && dragPosition === 'below' && !isDragging)
</script>

<li
  class="relative flex items-start gap-2 rounded px-2 py-1.5 transition-colors hover:bg-gray-700/50 {isDragging ? 'opacity-40' : ''}"
  ondragover={handleDragOver}
  ondrop={(e) => { e.preventDefault(); onDrop?.() }}
>
  {#if showAbove}
    <span class="pointer-events-none absolute inset-x-2 top-0 h-0.5 rounded bg-blue-500"></span>
  {/if}

  {#if !disabled}
    <span
      class="mt-1 flex-shrink-0 cursor-grab select-none text-gray-600 hover:text-gray-400 active:cursor-grabbing"
      draggable="true"
      ondragstart={(e) => { e.stopPropagation(); onDragStart?.(item.id) }}
      ondragend={(e) => { e.stopPropagation(); onDragEnd?.() }}
      role="button"
      tabindex="-1"
      aria-label="Drag to reorder"
    >⠿</span>
  {/if}

  <button
    class="mt-0.5 flex-shrink-0"
    onclick={() => onToggle(item.id)}
    aria-label={item.done ? 'Mark incomplete' : 'Mark complete'}
  >
    <span class="flex h-4 w-4 items-center justify-center rounded border {item.done ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-gray-500 hover:border-gray-400'}">
      {#if item.done}
        <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      {/if}
    </span>
  </button>

  {#if editing}
    <input
      bind:this={inputEl}
      bind:value={editText}
      class="flex-1 rounded bg-gray-700 px-1.5 py-0.5 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-blue-500"
      onkeydown={handleEditKeydown}
      onblur={() => onEditSave?.(item.id, editText.trim() || item.text)}
    />
  {:else}
    <span
      class="flex flex-1 flex-wrap items-center gap-1 text-sm {item.done ? 'text-gray-500 line-through' : 'text-gray-200'}"
      ondblclick={() => { if (!disabled && !item.done) onEditStart?.(item.id) }}
      title={disabled || item.done ? '' : 'Double-click to edit'}
    >
      {item.text}
      <WikiLink ref={item.linked_ref} />
    </span>
  {/if}

  {#if showBelow}
    <span class="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 rounded bg-blue-500"></span>
  {/if}
</li>
