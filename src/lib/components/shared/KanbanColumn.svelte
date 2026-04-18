<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    label,
    count,
    isHovered,
    ondrop,
    ondragenter,
    ondragleave,
    children
  }: {
    label: string
    count: number
    isHovered: boolean
    ondrop: () => void
    ondragenter: () => void
    ondragleave: () => void
    children: Snippet
  } = $props()
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
