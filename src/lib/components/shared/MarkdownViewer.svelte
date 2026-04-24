<script lang="ts">
  import { marked } from 'marked'

  let { body }: { body: string } = $props()

  marked.use({ gfm: true })

  let html = $derived(body.trim() ? (marked.parse(body) as string) : '')
</script>

{#if html}
  <div class="md-viewer">
    {@html html}
  </div>
{/if}

<style>
  .md-viewer {
    font-size: 0.8125rem;
    line-height: 1.65;
    color: rgb(156 163 175);
  }

  .md-viewer :global(h2) {
    color: rgb(209 213 219);
    font-size: 0.8125rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid rgb(55 65 81);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .md-viewer :global(h2:first-child) {
    margin-top: 0;
  }

  .md-viewer :global(h3) {
    color: rgb(209 213 219);
    font-size: 0.8rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.3rem;
  }

  .md-viewer :global(p) {
    margin-bottom: 0.5rem;
  }

  .md-viewer :global(ul),
  .md-viewer :global(ol) {
    padding-left: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .md-viewer :global(ul) {
    list-style-type: disc;
  }

  .md-viewer :global(ol) {
    list-style-type: decimal;
  }

  .md-viewer :global(li) {
    margin-bottom: 0.25rem;
  }

  .md-viewer :global(li input[type='checkbox']) {
    margin-right: 0.375rem;
    accent-color: rgb(59 130 246);
  }

  .md-viewer :global(li input[type='checkbox']:disabled) {
    opacity: 0.8;
    cursor: default;
  }

  .md-viewer :global(strong) {
    color: rgb(209 213 219);
    font-weight: 600;
  }

  .md-viewer :global(em) {
    font-style: italic;
  }

  .md-viewer :global(a) {
    color: rgb(96 165 250);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .md-viewer :global(a:hover) {
    color: rgb(147 197 253);
  }

  .md-viewer :global(code) {
    background: rgb(31 41 55);
    color: rgb(167 243 208);
    padding: 0.1rem 0.3rem;
    border-radius: 0.2rem;
    font-size: 0.75rem;
    font-family: ui-monospace, 'Cascadia Code', monospace;
  }

  .md-viewer :global(pre) {
    background: rgb(17 24 39);
    border: 1px solid rgb(55 65 81);
    border-radius: 0.375rem;
    padding: 0.75rem 1rem;
    overflow-x: auto;
    margin-bottom: 0.75rem;
  }

  .md-viewer :global(pre code) {
    background: transparent;
    padding: 0;
    color: rgb(209 213 219);
  }

  .md-viewer :global(blockquote) {
    border-left: 3px solid rgb(59 130 246);
    padding-left: 0.75rem;
    color: rgb(107 114 128);
    margin: 0.5rem 0;
    font-style: italic;
  }

  .md-viewer :global(hr) {
    border: none;
    border-top: 1px solid rgb(55 65 81);
    margin: 1rem 0;
  }
</style>
