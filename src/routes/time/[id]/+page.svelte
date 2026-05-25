<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import { invalidateAll } from '$app/navigation'

  let { data } = $props()

  let editing = $state(false)
  let description = $state(data.entry.description)
  let category = $state(data.entry.category)
  let date = $state(data.entry.date)
  let saving = $state(false)
  let saved = $state(false)

  const categoryColors: Record<string, string> = {
    billable: 'text-green-400', 'r&d': 'text-blue-400', marketing: 'text-purple-400',
    internal: 'text-gray-400', training: 'text-yellow-400', sales: 'text-orange-400',
  }

  async function save() {
    saving = true
    await fetch(`/api/time-entries/${data.entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, category, date }),
    })
    saving = false
    saved = true
    editing = false
    setTimeout(() => (saved = false), 2000)
    await invalidateAll()
  }

  async function deleteEntry() {
    if (!confirm('Delete this time entry?')) return
    await fetch(`/api/time-entries/${data.entry.id}`, { method: 'DELETE' })
    window.location.href = '/time'
  }
</script>

<div class="p-6 max-w-2xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/time" class="text-gray-500 hover:text-gray-300 text-sm">← Time</a>
    <span class="text-gray-600">/</span>
    <span class="text-gray-400 text-sm font-mono">{data.entry.id}</span>
    <div class="ml-auto flex gap-2">
      {#if !editing}
        <button onclick={() => (editing = true)} class="text-xs px-3 py-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700">Edit</button>
        <button onclick={deleteEntry} class="text-xs px-3 py-1.5 rounded bg-red-900/50 text-red-400 hover:bg-red-900">Delete</button>
      {/if}
    </div>
  </div>

  <div class="bg-gray-900 rounded border border-gray-800 p-6 space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Date</label>
        {#if editing}
          <input type="date" bind:value={date} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
        {:else}
          <p class="text-gray-200 text-sm tabular-nums">{data.entry.date}</p>
        {/if}
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Duration</label>
        <p class="text-blue-400 text-sm tabular-nums">{data.entry.hours_rounded}h ({data.entry.minutes} min)</p>
      </div>
    </div>

    <div>
      <label class="text-xs text-gray-500 block mb-1">Description</label>
      {#if editing}
        <input bind:value={description} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
      {:else}
        <p class="text-gray-200 text-sm">{data.entry.description}</p>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Category</label>
        {#if editing}
          <select bind:value={category} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full">
            <option value="billable">billable</option>
            <option value="r&d">r&d</option>
            <option value="marketing">marketing</option>
            <option value="internal">internal</option>
            <option value="training">training</option>
            <option value="sales">sales</option>
          </select>
        {:else}
          <span class="text-sm {categoryColors[data.entry.category] ?? 'text-gray-400'}">{data.entry.category}</span>
        {/if}
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Invoice</label>
        <p class="text-gray-400 text-sm">{data.entry.invoice_id ?? '—'}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Project</label>
        <a href="/pm" class="text-blue-400 hover:text-blue-300 text-sm">{data.entry.project_id}</a>
      </div>
      {#if data.entry.task_id}
        <div>
          <label class="text-xs text-gray-500 block mb-1">Task</label>
          <a href="/pm/tasks/{data.entry.task_id}" class="text-blue-400 hover:text-blue-300 text-sm">{data.entry.task_id}</a>
        </div>
      {/if}
    </div>

    {#if editing}
      <div class="flex gap-2 pt-2">
        <button onclick={save} disabled={saving} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onclick={() => { editing = false }} disabled={saving} class="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded transition-colors">Cancel</button>
      </div>
    {/if}
    {#if saved}
      <p class="text-green-400 text-xs">Saved!</p>
    {/if}
  </div>
</div>
