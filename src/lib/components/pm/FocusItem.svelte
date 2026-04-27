<script lang="ts">
    /**
     * Individual focus item with checkbox, drag-reorder, and inline edit support.
     * @component
     */
    import WikiLink from "./WikiLink.svelte";
    import type { FocusItem } from "$lib/data/types.js";

    export type Props = {
        /** The focus item data to render. */
        item: FocusItem;
        /** Callback to toggle the done state of an item by ID. */
        onToggle: (itemId: string) => void;
        /** ID of the item currently being dragged, or null. */
        draggingId?: string | null;
        /** ID of the item currently being dragged over, or null. */
        dragOverId?: string | null;
        /** Whether the drop indicator appears above or below the target item. */
        dragPosition?: "above" | "below" | null;
        /** Callback when dragging starts; receives the item ID. */
        onDragStart?: (id: string) => void;
        /** Callback when dragging ends. */
        onDragEnd?: () => void;
        /** Callback while dragging over this item; receives ID and half-position. */
        onDragOver?: (id: string, position: "above" | "below") => void;
        /** Callback when a dragged item is dropped onto this item. */
        onDrop?: () => void;
        /** Whether this item is currently in inline-edit mode. */
        editing?: boolean;
        /** Callback to enter edit mode for a given item ID. */
        onEditStart?: (id: string) => void;
        /** Callback to save inline edits; receives item ID and new text. */
        onEditSave?: (id: string, text: string) => void;
        /** Callback to cancel inline editing without saving. */
        onEditCancel?: () => void;
        /** When true, disables interactions (archived list). */
        disabled?: boolean;
    };

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
    }: Props = $props();

    let editText = $state(item.text);
    let inputEl = $state<HTMLInputElement | null>(null);

    $effect(() => {
        if (editing) {
            editText = item.text;
            inputEl?.focus();
            inputEl?.select();
        }
    });

    function handleDragOver(e: DragEvent) {
        if (!onDragOver || disabled) return;
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onDragOver(
            item.id,
            e.clientY < rect.top + rect.height / 2 ? "above" : "below",
        );
    }

    function handleEditKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            onEditSave?.(item.id, editText.trim() || item.text);
        } else if (e.key === "Escape") {
            onEditCancel?.();
        }
    }

    const isDragging = $derived(draggingId === item.id);
    const showAbove = $derived(
        dragOverId === item.id && dragPosition === "above" && !isDragging,
    );
    const showBelow = $derived(
        dragOverId === item.id && dragPosition === "below" && !isDragging,
    );
    const itemState = $derived(
        item.done ? "done" : item.in_progress ? "in_progress" : "pending",
    );
</script>

<li
    class="relative flex items-start gap-2 rounded px-2 py-1.5 transition-colors hover:bg-gray-700/50 {isDragging
        ? 'opacity-40'
        : ''}"
    ondragover={handleDragOver}
    ondrop={(e) => {
        e.preventDefault();
        onDrop?.();
    }}
>
    {#if showAbove}
        <span
            class="pointer-events-none absolute inset-x-2 top-0 h-0.5 rounded bg-blue-500"
        ></span>
    {/if}

    {#if !disabled}
        <span
            class="mt-1 flex-shrink-0 cursor-grab select-none text-gray-600 hover:text-gray-400 active:cursor-grabbing"
            draggable="true"
            ondragstart={(e) => {
                e.stopPropagation();
                onDragStart?.(item.id);
            }}
            ondragend={(e) => {
                e.stopPropagation();
                onDragEnd?.();
            }}
            role="button"
            tabindex="-1"
            aria-label="Drag to reorder">⠿</span
        >
    {/if}

    <button
        class="mt-0.5 flex-shrink-0"
        onclick={() => onToggle(item.id)}
        aria-label={itemState === "done"
            ? "Mark incomplete"
            : itemState === "in_progress"
              ? "Mark complete"
              : "Mark in progress"}
    >
        <span
            class="flex h-4 w-4 items-center justify-center rounded border {itemState ===
            'done'
                ? 'border-green-500 bg-green-500/20 text-green-400'
                : itemState === 'in_progress'
                  ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                  : 'border-gray-500 hover:border-gray-400'}"
        >
            {#if itemState === "done"}
                <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            {:else if itemState === "in_progress"}
                <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path
                        d="M2 6h8"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
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
            class="flex flex-1 flex-wrap items-center gap-1 text-sm {itemState ===
            'done'
                ? 'text-gray-500 line-through'
                : itemState === 'in_progress'
                  ? 'text-amber-300'
                  : 'text-gray-200'}"
            ondblclick={() => {
                if (!disabled && itemState !== "done") onEditStart?.(item.id);
            }}
            title={disabled || itemState === "done"
                ? ""
                : "Double-click to edit"}
        >
            {item.text}
            <WikiLink ref={item.linked_ref} />
        </span>
    {/if}

    {#if showBelow}
        <span
            class="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 rounded bg-blue-500"
        ></span>
    {/if}
</li>
