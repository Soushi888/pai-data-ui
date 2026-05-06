<script lang="ts">
  import { marked } from 'marked'

  interface Props {
    role: 'user' | 'assistant'
    content: string
  }

  let { role, content }: Props = $props()

  marked.use({ gfm: true })

  // Wrap TELOS filenames in clickable links
  function linkifyTelos(text: string): string {
    return text.replace(
      /\b((?:ALCHEMY\/)?[A-Z_]+\.md)\b/g,
      (match) => {
        const path = match.replace('.md', '')
        return `<a href="/telos/${encodeURIComponent(path)}" class="telos-link" data-ctrl-link="${path}">${match}</a>`
      }
    )
  }

  const html = $derived(() => {
    if (!content.trim()) return ''
    const parsed = marked.parse(content) as string
    return role === 'assistant' ? linkifyTelos(parsed) : parsed
  })
</script>

<div class="flex {role === 'user' ? 'justify-end' : 'justify-start'} px-3 py-1">
  <div
    class="max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed"
    style="
      {role === 'user'
        ? `background: var(--athanor-surface); color: var(--athanor-chalk); border: 1px solid var(--athanor-border);`
        : `background: color-mix(in srgb, var(--athanor-arcane) 10%, var(--athanor-bg)); color: var(--athanor-chalk); border: 1px solid color-mix(in srgb, var(--athanor-arcane) 30%, transparent);`}
    "
  >
    {#if role === 'assistant'}
      <p class="text-[9px] font-semibold mb-1" style="color: var(--athanor-arcane);">SoushAI</p>
    {/if}
    {@html html()}
  </div>
</div>

<style>
  :global(.telos-link) {
    color: var(--athanor-gold);
    text-decoration: underline;
    text-underline-offset: 2px;
    font-family: ui-monospace, monospace;
    font-size: 0.7rem;
  }
  :global(.telos-link:hover) {
    color: var(--athanor-ember);
  }
</style>
