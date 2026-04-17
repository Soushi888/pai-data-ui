<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import { invalidateAll } from '$app/navigation'

  let { data } = $props()

  let title = $state(data.task.title)
  let status = $state(data.task.status)
  let priority = $state(data.task.priority)
  let t_shirt_size = $state(data.task.t_shirt_size ?? '')
  let epic = $state(data.task.epic ?? '')
  let tags = $state((data.task.tags ?? []).join(', '))
  let body = $state(data.body)
  let saving = $state(false)
  let saved = $state(false)

  let logDate = $state(new Date().toISOString().split('T')[0])
  let logHours = $state<number>(1)
  let logNotes = $state('')
  let logging = $state(false)

  const totalHours = $derived(
    (data.task.time_logs ?? []).reduce((s, l) => s + l.hours, 0)
  )

  async function save() {
    saving = true
    await fetch(`/api/tasks/${data.task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, status, priority,
        t_shirt_size: t_shirt_size || undefined,
        epic: epic || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
      })
    })
    saving = false
    saved = true
    setTimeout(() => (saved = false), 2000)
  }

  async function logTime(e: Event) {
    e.preventDefault()
    if (!logHours || logHours <= 0) return
    logging = true
    await fetch(`/api/tasks/${data.task.id}/time-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: logDate, hours: logHours, notes: logNotes || undefined })
    })
    logNotes = ''
    logging = false
    await invalidateAll()
  }
</script>

<div class="p-6 max-w-4xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/pm/tasks" class="text-gray-500 hover:text-gray-300 text-sm">← Tasks</a>
    <a href="/pm/projects/{data.task.project_id}" class="text-gray-500 hover:text-gray-300 text-sm">{data.projectTitle}</a>
    <span class="text-gray-600">/</span>
    <StatusBadge status={data.task.status} />
    <StatusBadge status={data.task.priority} />
  </div>

  <div class="grid grid-cols-3 gap-6">
    <div class="col-span-2 space-y-4">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Title</label>
        <input bind:value={title} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="text-xs text-gray-500 block mb-1">Status</label>
          <select bind:value={status} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full">
            <option>todo</option><option>in-progress</option><option>done</option><option>blocked</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Priority</label>
          <select bind:value={priority} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full">
            <option>low</option><option>medium</option><option>high</option><option>critical</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Size</label>
          <select bind:value={t_shirt_size} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full">
            <option value="">—</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs text-gray-500 block mb-1">Epic</label>
          <input bind:value={epic} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Tags</label>
          <input bind:value={tags} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
        </div>
      </div>

      {#if data.task.external_ref}
        <div class="bg-gray-900 rounded p-3 border border-gray-800">
          <p class="text-xs text-gray-500 mb-1">External Ref</p>
          <a href={data.task.external_ref.url} target="_blank" class="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2">
            <span class="font-mono bg-gray-800 px-1.5 py-0.5 rounded text-xs">{data.task.external_ref.system.toUpperCase()}#{data.task.external_ref.id}</span>
            <span class="text-gray-500 text-xs">↗</span>
          </a>
        </div>
      {/if}

      {#if (data.task.relations ?? []).length > 0}
        <div>
          <p class="text-xs text-gray-500 mb-1">Relations</p>
          {#each data.task.relations ?? [] as rel}
            <div class="flex items-center gap-2 text-sm">
              <StatusBadge status={rel.type} />
              <a href="/pm/tasks/{rel.task_id}" class="text-blue-400 hover:text-blue-300 text-xs">{rel.task_id}</a>
            </div>
          {/each}
        </div>
      {/if}

      <button onclick={save} disabled={saving} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
      </button>
    </div>

    <div>
      <label class="text-xs text-gray-500 block mb-1">Progress Notes</label>
      <textarea bind:value={body} rows="10" class="bg-gray-800 border border-gray-700 text-gray-300 rounded px-3 py-2 text-sm font-mono w-full resize-none focus:outline-none focus:border-blue-500 mb-2"></textarea>
      <button onclick={save} class="text-xs text-gray-500 hover:text-gray-300">Save notes</button>
    </div>
  </div>

  <!-- Time logs -->
  <div class="mt-8">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
      Time Logs <span class="text-gray-600 font-normal">— {totalHours}h total</span>
    </h2>

    {#if (data.task.time_logs ?? []).length > 0}
      <table class="w-full text-sm mb-4">
        <thead>
          <tr class="text-gray-500 text-left">
            <th class="pb-2 font-normal">Date</th>
            <th class="pb-2 font-normal">Hours</th>
            <th class="pb-2 font-normal">Notes</th>
          </tr>
        </thead>
        <tbody>
          {#each [...(data.task.time_logs ?? [])].reverse() as log}
            <tr class="border-t border-gray-800">
              <td class="py-2 text-gray-400 tabular-nums">{log.date}</td>
              <td class="py-2 text-blue-400 tabular-nums">{log.hours}h</td>
              <td class="py-2 text-gray-500 text-xs">{log.notes ?? ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p class="text-gray-600 text-xs mb-4">No time logged yet.</p>
    {/if}

    <form onsubmit={logTime} class="flex gap-2 items-end">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Date</label>
        <input type="date" bind:value={logDate} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Hours</label>
        <input type="number" bind:value={logHours} min="0.25" step="0.25" class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-24" />
      </div>
      <div class="flex-1">
        <label class="text-xs text-gray-500 block mb-1">Notes</label>
        <input bind:value={logNotes} placeholder="What did you work on?" class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
      </div>
      <button type="submit" disabled={logging} class="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
        {logging ? '…' : '+ Log'}
      </button>
    </form>
  </div>
</div>
