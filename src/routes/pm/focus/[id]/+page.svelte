<script lang="ts">
  import MarkdownViewer from '$lib/components/shared/MarkdownViewer.svelte'
  import FocusListPanel from '$lib/components/pm/FocusListPanel.svelte'

  let { data } = $props()

  const isDaily = data.list.type === 'focus-daily'
  const dateLabel = isDaily && 'date' in data.list ? data.list.date : 'week' in data.list ? data.list.week : data.id
</script>

<svelte:head>
  <title>Focus: {dateLabel}</title>
</svelte:head>

<div class="p-6">
  <div class="mb-6 flex items-center gap-4">
    <a href="/pm/focus" class="text-xs text-gray-500 hover:text-gray-300">← Back to Focus</a>
    <span class="text-gray-600">|</span>
    <h1 class="text-sm font-semibold text-gray-200">{dateLabel}</h1>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <FocusListPanel
      list={data.list}
      listId={data.id}
      type={data.list.type}
      label={dateLabel}
    />

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
