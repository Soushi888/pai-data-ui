<script lang="ts">
  /**
   * Displays a list of tag labels as inline chips.
   * @component
   */
  interface Props {
    /** Array of tag strings to display. */
    tags: string[];
    /** Whether tags render as links. Defaults to true. */
    clickable?: boolean;
  }

  let { tags, clickable = true }: Props = $props()
</script>

{#if tags?.length}
  <div class="flex flex-wrap gap-1">
    {#each tags as tag}
      {#if clickable}
        <a
          href="/tags/{tag}"
          onclick={(e) => e.stopPropagation()}
          class="px-1.5 py-0.5 bg-gray-800 text-gray-400 text-xs rounded hover:bg-gray-700 hover:text-gray-200 transition-colors"
        >{tag}</a>
      {:else}
        <span class="px-1.5 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">{tag}</span>
      {/if}
    {/each}
  </div>
{/if}
