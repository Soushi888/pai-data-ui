<script lang="ts">
  import MarkdownViewer from '$lib/components/shared/MarkdownViewer.svelte'
  import FocusItem from '$lib/components/pm/FocusItem.svelte'

  let { data } = $props()

  const isDaily = data.list.type === 'focus-daily'
  const dateLabel = isDaily && 'date' in data.list ? data.list.date : 'week' in data.list ? data.list.week : data.id
  const doneCount = data.list.items.filter((i: { done: boolean }) => i.done).length
</script>

<svelte:head>
  <title>Focus: {dateLabel}</title>
</svelte:head>

<div class="p-6">
  <div class="mb-6 flex items-center gap-4">
    <a href="/pm/focus" class="text-xs text-gray-500 hover:text-gray-300">← Back to Focus</a>
    <span class="text-gray-600">|</span>
    <h1 class="text-sm font-semibold text-gray-200">{dateLabel}</h1>
    <span class="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-400">{data.list.status}</span>
    <span class="text-xs text-gray-500">{doneCount}/{data.list.items.length} done</span>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <div class="rounded-lg bg-gray-800 p-4">
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Items</h2>
      {#if data.list.items.length === 0}
        <p class="text-sm text-gray-600">No items</p>
      {:else}
        <ul class="space-y-0.5">
          {#each data.list.items as item}
            <FocusItem {item} onToggle={() => {}} disabled={true} />
          {/each}
        </ul>
      {/if}

      {#if data.list.carried_from}
        <p class="mt-3 text-xs text-gray-600">
          Carried from: <a href="/pm/focus/{data.list.carried_from}" class="text-gray-500 hover:text-gray-400">{data.list.carried_from}</a>
        </p>
      {/if}
    </div>

    {#if data.body?.trim()}
      <div class="rounded-lg bg-gray-800 p-4">
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Journal</h2>
        <div class="prose prose-invert prose-sm max-w-none">
          <MarkdownViewer body={data.body} />
        </div>
      </div>
    {/if}
  </div>
</div>
