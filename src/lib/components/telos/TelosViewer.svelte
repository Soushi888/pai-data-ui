<script lang="ts">
  import MarkdownViewer from '$lib/components/shared/MarkdownViewer.svelte'
  import DiffOverlay from './DiffOverlay.svelte'
  import type { Change } from 'diff'

  interface Props {
    file: string
    content: string
    diff: Change[] | null
    streaming: boolean
    ondiffDismiss: () => void
  }

  let { file, content, diff, streaming, ondiffDismiss }: Props = $props()

  const title = $derived(file.replace('.md', '').split('/').pop() ?? file)
</script>

<div
  class="flex-1 flex flex-col overflow-hidden relative"
  style="background: var(--athanor-bg);"
>
  <div
    class="px-6 py-3 border-b flex items-center gap-3 flex-shrink-0"
    style="border-color: var(--athanor-border);"
  >
    <span class="text-xs font-mono" style="color: var(--athanor-mist);">{file}</span>
    <span class="text-[10px] px-1.5 py-0.5 rounded font-mono" style="background: var(--athanor-surface); color: var(--athanor-ember);">
      TELOS
    </span>
  </div>

  <div class="flex-1 overflow-y-auto px-8 py-6">
    <h1 class="text-2xl font-semibold mb-6" style="color: var(--athanor-gold);">{title}</h1>
    <div class="telos-viewer">
      <MarkdownViewer body={content} />
    </div>
  </div>

  {#if diff && diff.length > 0}
    <DiffOverlay {diff} {streaming} ondismiss={ondiffDismiss} />
  {/if}
</div>

<style>
  .telos-viewer :global(.md-viewer h2) {
    color: var(--athanor-gold) !important;
    border-color: var(--athanor-border) !important;
  }
  .telos-viewer :global(.md-viewer h3) {
    color: var(--athanor-chalk) !important;
  }
  .telos-viewer :global(.md-viewer p),
  .telos-viewer :global(.md-viewer li) {
    color: var(--athanor-chalk);
  }
  .telos-viewer :global(.md-viewer strong) {
    color: var(--athanor-gold);
  }
  .telos-viewer :global(.md-viewer blockquote) {
    border-color: var(--athanor-arcane) !important;
    color: var(--athanor-mist) !important;
  }
  .telos-viewer :global(.md-viewer a) {
    color: var(--athanor-arcane);
  }
  .telos-viewer :global(.md-viewer code) {
    background: var(--athanor-surface);
    color: var(--athanor-ember);
  }
  .telos-viewer :global(.md-viewer hr) {
    border-color: var(--athanor-border) !important;
  }
</style>
