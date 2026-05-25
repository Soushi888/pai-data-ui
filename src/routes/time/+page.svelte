<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import TimeEntryRow from '$lib/components/time/TimeEntryRow.svelte'
  import TimeEntryForm from '$lib/components/time/TimeEntryForm.svelte'
  import type { TimeEntry } from '$lib/data/types.js'

  let { data } = $props()

  let showForm = $state(false)
  let fromFilter = $state(data.filters.from)
  let toFilter = $state(data.filters.to)
  let categoryFilter = $state(data.filters.category)

  function applyFilters() {
    const params = new URLSearchParams()
    if (fromFilter) params.set('from', fromFilter)
    if (toFilter) params.set('to', toFilter)
    if (categoryFilter) params.set('category', categoryFilter)
    goto(`/time?${params.toString()}`)
  }

  function clearFilters() {
    fromFilter = ''; toFilter = ''; categoryFilter = ''
    goto('/time')
  }

  function handleSuccess() {
    showForm = false
    goto($page.url.href)
  }
</script>

<div class="p-6 max-w-6xl">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-200">Time Entries</h1>
      <p class="text-gray-500 text-sm mt-0.5">{data.stats.count} entries</p>
    </div>
    <div class="flex gap-2">
      <a href="/time/stats" class="text-xs px-3 py-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">Stats</a>
      <button onclick={() => (showForm = !showForm)} class="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
        {showForm ? 'Cancel' : '+ New Entry'}
      </button>
    </div>
  </div>

  <!-- Stats header -->
  <div class="grid grid-cols-3 gap-4 mb-6">
    <div class="bg-gray-900 rounded border border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-1">This Week</p>
      <p class="text-2xl font-semibold text-blue-400 tabular-nums">{data.stats.totalHoursWeek}h</p>
    </div>
    <div class="bg-gray-900 rounded border border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-1">This Month</p>
      <p class="text-2xl font-semibold text-gray-200 tabular-nums">{data.stats.totalHoursMonth}h</p>
    </div>
    <div class="bg-gray-900 rounded border border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-1">Billable (Month)</p>
      <p class="text-2xl font-semibold text-green-400 tabular-nums">{data.stats.billableHoursMonth}h</p>
    </div>
  </div>

  {#if showForm}
    <div class="mb-6">
      <TimeEntryForm onSuccess={handleSuccess} />
    </div>
  {/if}

  <!-- Filters -->
  <div class="flex gap-3 mb-4 items-end flex-wrap">
    <div>
      <label class="text-xs text-gray-500 block mb-1">From</label>
      <input type="date" bind:value={fromFilter} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
    </div>
    <div>
      <label class="text-xs text-gray-500 block mb-1">To</label>
      <input type="date" bind:value={toFilter} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
    </div>
    <div>
      <label class="text-xs text-gray-500 block mb-1">Category</label>
      <select bind:value={categoryFilter} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500">
        <option value="">All</option>
        <option value="billable">billable</option>
        <option value="r&d">r&d</option>
        <option value="marketing">marketing</option>
        <option value="internal">internal</option>
        <option value="training">training</option>
        <option value="sales">sales</option>
      </select>
    </div>
    <button onclick={applyFilters} class="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-3 py-1.5 rounded transition-colors">Filter</button>
    {#if data.filters.from || data.filters.to || data.filters.category}
      <button onclick={clearFilters} class="text-gray-500 hover:text-gray-300 text-sm px-3 py-1.5 rounded transition-colors">Clear</button>
    {/if}
  </div>

  <!-- Table -->
  {#if data.entries.length === 0}
    <p class="text-gray-600 text-sm">No entries found.</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="text-gray-500 text-xs uppercase tracking-wider text-left">
            <th class="pb-2 px-3 font-normal">Date</th>
            <th class="pb-2 px-3 font-normal">Description</th>
            <th class="pb-2 px-3 font-normal">Project</th>
            <th class="pb-2 px-3 font-normal">Task</th>
            <th class="pb-2 px-3 font-normal text-right">Hours</th>
            <th class="pb-2 px-3 font-normal">Category</th>
          </tr>
        </thead>
        <tbody>
          {#each data.entries as entry (entry.id)}
            <TimeEntryRow {entry} />
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
