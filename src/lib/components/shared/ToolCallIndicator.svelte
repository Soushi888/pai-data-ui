<script lang="ts">
  interface Props {
    tools: string[]
  }

  let { tools }: Props = $props()
</script>

{#if tools.length > 0}
  <div class="flex items-center gap-2 px-3 py-1.5 flex-wrap">
    <svg
      class="w-3.5 h-3.5 flex-shrink-0 animate-spin"
      style="color: var(--athanor-ember);"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
    {#each tools as tool}
      <span
        class="text-[10px] font-mono px-2 py-0.5 rounded-full"
        style="background: color-mix(in srgb, var(--athanor-ember) 15%, transparent); color: var(--athanor-ember); border: 1px solid color-mix(in srgb, var(--athanor-ember) 40%, transparent);"
      >
        {tool}
      </span>
    {/each}
  </div>
{/if}
