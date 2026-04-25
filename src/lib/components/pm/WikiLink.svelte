<script lang="ts">
  let { ref }: { ref?: string } = $props()

  const href = $derived(() => {
    if (!ref) return null
    if (ref.startsWith('task-')) return `/pm/tasks/${ref}`
    if (ref.startsWith('proj-')) return `/pm/projects/${ref}`
    if (ref.startsWith('contact-')) return `/crm/${ref}`
    return null
  })
</script>

{#if ref}
  {#if href()}
    <a
      href={href()}
      class="ml-1 inline-block rounded bg-blue-900/40 px-1.5 py-0.5 font-mono text-xs text-blue-400 hover:bg-blue-900/70"
      onclick={(e) => e.stopPropagation()}
    >
      {ref}
    </a>
  {:else}
    <span class="ml-1 inline-block rounded bg-gray-700 px-1.5 py-0.5 font-mono text-xs text-gray-400">
      {ref}
    </span>
  {/if}
{/if}
