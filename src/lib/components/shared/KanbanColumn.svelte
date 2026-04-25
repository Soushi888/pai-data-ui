<script lang="ts">
  /**
   * Drag-and-drop kanban column with header, item count, and drop zone.
   * @component
   */
  import type { Snippet } from 'svelte'

  interface Props {
    /** Column header label. */
    label: string;
    /** Badge count displayed next to the header. */
    count: number;
    /** Whether a card is currently dragged over this column. */
    isHovered: boolean;
    /** Handler called when a dragged card is dropped onto the column. */
    ondrop: () => void;
    /** Handler called when a drag enters the column's drop zone. */
    ondragenter: () => void;
    /** Handler called when a drag leaves the column's drop zone. */
    ondragleave: () => void;
    /** Slot content rendered inside the column body. */
    children: Snippet;
  }

  let {
    label,
    count,
    isHovered,
    ondrop,
    ondragenter,
    ondragleave,
    children
  }: Props = $props()
</script>

<div
  class="bg-gray-900/50 rounded-lg p-3 min-h-32 transition-all {isHovered ? 'ring-1 ring-blue-500/40' : ''}"
  ondragover={(e) => e.preventDefault()}
  {ondrop}
  {ondragenter}
  {ondragleave}
>
  <div class="flex items-center justify-between mb-3">
    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
    <span class="text-xs text-gray-600">{count}</span>
  </div>
  {@render children()}
</div>
