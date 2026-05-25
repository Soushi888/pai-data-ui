<script lang="ts">
  /**
   * Renders an internal wiki-style link to a PAI entity (task, project, or contact).
   * @component
   */
  interface Props {
    /** Entity reference string (e.g. "task-123", "proj-456", "contact-789"). Optional. */
    ref?: string;
  }

  let { ref }: Props = $props()

  const href = $derived(
    !ref ? null :
    ref.startsWith('task-') ? `/pm/tasks/${ref}` :
    ref.startsWith('proj-') ? `/pm/projects/${ref}` :
    ref.startsWith('contact-') ? `/crm/${ref}` :
    null
  )
</script>

{#if ref}
  {#if href}
    <a
      href={href}
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
