<script lang="ts">
  import type { Change } from 'diff'
  import { onMount } from 'svelte'

  interface Props {
    diff: Change[]
    streaming: boolean
    ondismiss: () => void
  }

  let { diff, streaming, ondismiss }: Props = $props()

  let visible = $state(true)
  let timer: ReturnType<typeof setTimeout>

  $effect(() => {
    clearTimeout(timer)
    if (!streaming) {
      timer = setTimeout(() => {
        visible = false
        ondismiss()
      }, 8000)
    }
    return () => clearTimeout(timer)
  })

  function dismiss() {
    visible = false
    ondismiss()
  }

  const stats = $derived(() => {
    let added = 0
    let removed = 0
    for (const c of diff) {
      if (c.added) added += c.count ?? 1
      if (c.removed) removed += c.count ?? 1
    }
    return { added, removed }
  })
</script>

{#if visible}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="absolute inset-x-0 bottom-0 rounded-t-lg overflow-hidden cursor-pointer transition-all"
    style="
      background: var(--athanor-surface);
      border: 1px solid var(--athanor-border);
      border-bottom: none;
      max-height: 280px;
      {streaming ? 'animation: pulse-border 1.5s ease-in-out infinite;' : ''}
    "
    onclick={dismiss}
    role="button"
    tabindex="0"
  >
    <div
      class="flex items-center justify-between px-3 py-2 text-xs border-b"
      style="border-color: var(--athanor-border);"
    >
      <span style="color: var(--athanor-gold);">SoushAI edit</span>
      <div class="flex gap-3">
        <span style="color: rgb(74, 222, 128);">+{stats().added} lines</span>
        <span style="color: rgb(248, 113, 113);">-{stats().removed} lines</span>
        {#if streaming}
          <span style="color: var(--athanor-ember);">streaming...</span>
        {:else}
          <span style="color: var(--athanor-mist);">click to dismiss</span>
        {/if}
      </div>
    </div>
    <div class="overflow-y-auto font-mono text-[11px] leading-relaxed p-2" style="max-height: 220px;">
      {#each diff as change}
        {#if change.added}
          <div style="background: var(--athanor-diff-add); color: rgb(74, 222, 128);">
            {#each change.value.split('\n').filter((l) => l !== '') as line}
              <div class="px-2">+ {line}</div>
            {/each}
          </div>
        {:else if change.removed}
          <div style="background: var(--athanor-diff-rem); color: rgb(248, 113, 113);">
            {#each change.value.split('\n').filter((l) => l !== '') as line}
              <div class="px-2">- {line}</div>
            {/each}
          </div>
        {:else}
          <div style="color: var(--athanor-mist);" class="px-2 opacity-40 line-clamp-2">
            {change.value.slice(0, 120)}
          </div>
        {/if}
      {/each}
    </div>
  </div>
{/if}

<style>
  @keyframes pulse-border {
    0%, 100% { border-color: var(--athanor-border); }
    50% { border-color: var(--athanor-ember); }
  }
</style>
