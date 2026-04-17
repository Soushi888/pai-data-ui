<script lang="ts">
  let { tags }: { tags: string[] } = $props()
</script>

{#if tags?.length}
  <div class="flex flex-wrap gap-1">
    {#each tags as tag}
      <span class="px-1.5 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">{tag}</span>
    {/each}
  </div>
{/if}
