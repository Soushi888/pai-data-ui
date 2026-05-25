<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import TagList from '$lib/components/shared/TagList.svelte'
  import ChipsInput from '$lib/components/shared/ChipsInput.svelte'
  import MarkdownViewer from '$lib/components/shared/MarkdownViewer.svelte'
  import TimeEntryRow from '$lib/components/time/TimeEntryRow.svelte'
  import TimeEntryForm from '$lib/components/time/TimeEntryForm.svelte'
  import { invalidateAll } from '$app/navigation'

  let { data } = $props()

  let editing = $state(false)
  let title = $state(data.task.title)
  let status = $state(data.task.status)
  let priority = $state(data.task.priority)
  let t_shirt_size = $state(data.task.t_shirt_size ?? '')
  let epic = $state(data.task.epic ?? '')
  let tags = $state<string[]>(data.task.tags ?? [])
  let saving = $state(false)
  let saved = $state(false)
  let snapshot: { title: string; status: 'todo' | 'in-progress' | 'done' | 'blocked'; priority: 'low' | 'medium' | 'high' | 'critical'; t_shirt_size: string; epic: string; tags: string[] } | null = null

  let showLogForm = $state(false)
  let addingToFocus = $state(false)
  let addedToFocus = $state<'added' | 'already' | null>(null)

  async function addToFocus() {
    addingToFocus = true
    const res = await fetch(`/api/tasks/${data.task.id}/add-to-focus`, { method: 'POST' })
    const body = await res.json()
    addingToFocus = false
    addedToFocus = body.already ? 'already' : 'added'
    setTimeout(() => (addedToFocus = null), 3000)
  }

  const inputClass = () =>
    `border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none transition-colors ${editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default'}`

  const selectClass = () =>
    `border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none transition-colors ${editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default appearance-none'}`

  function startEdit() {
    snapshot = { title, status, priority, t_shirt_size, epic, tags: [...tags] }
    editing = true
  }

  function cancel() {
    if (snapshot) {
      ;({ title, status, priority, t_shirt_size, epic } = snapshot)
      tags = [...snapshot.tags]
      snapshot = null
    }
    editing = false
  }

  async function apply() {
    await save()
    snapshot = null
    editing = false
  }

  async function save() {
    saving = true
    await fetch(`/api/tasks/${data.task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, status, priority,
        t_shirt_size: t_shirt_size || undefined,
        epic: epic || undefined,
        tags
      })
    })
    saving = false
    saved = true
    setTimeout(() => (saved = false), 2000)
  }

  async function handleLogSuccess() {
    showLogForm = false
    await invalidateAll()
  }
</script>

<svelte:window onkeydown={(e) => { if (e.ctrlKey && e.key === 'Enter' && editing && !saving) apply() }} />

<div class="p-6 max-w-6xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/pm/tasks" class="text-gray-500 hover:text-gray-300 text-sm">← Tasks</a>
    <a href="/pm/projects/{data.task.project_id}" class="text-gray-500 hover:text-gray-300 text-sm">{data.projectTitle}</a>
    <span class="text-gray-600">/</span>
    <StatusBadge status={data.task.status} />
    <StatusBadge status={data.task.priority} />
    <div class="ml-auto flex gap-2">
      <button
        onclick={addToFocus}
        disabled={addingToFocus}
        class="text-xs px-3 py-1.5 rounded transition-colors
          {addedToFocus === 'added' ? 'bg-green-900/50 text-green-400' :
           addedToFocus === 'already' ? 'bg-gray-800 text-gray-500' :
           'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
      >
        {addingToFocus ? '…' : addedToFocus === 'added' ? '✓ Added to Focus' : addedToFocus === 'already' ? 'Already in Focus' : '+ Focus'}
      </button>
      <a href="/pm/tasks/{data.task.id}/edit" class="text-xs px-3 py-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">Edit Raw</a>
      {#if !editing}
        <button
          onclick={startEdit}
          class="text-xs px-3 py-1.5 rounded transition-colors bg-gray-800 text-gray-400 hover:bg-gray-700"
        >Edit</button>
      {/if}
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div class="space-y-4">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Title</label>
        <input bind:value={title} readonly={!editing} class={inputClass()} />
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="text-xs text-gray-500 block mb-1">Status</label>
          <select bind:value={status} disabled={!editing} class={selectClass()}>
            <option>todo</option><option>in-progress</option><option>done</option><option>blocked</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Priority</label>
          <select bind:value={priority} disabled={!editing} class={selectClass()}>
            <option>low</option><option>medium</option><option>high</option><option>critical</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Size</label>
          <select bind:value={t_shirt_size} disabled={!editing} class={selectClass()}>
            <option value="">—</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>
          </select>
        </div>
      </div>

      <div>
        <label class="text-xs text-gray-500 block mb-1">Epic</label>
        <input bind:value={epic} readonly={!editing} class={inputClass()} />
      </div>

      <div>
        <label class="text-xs text-gray-500 block mb-1">Tags</label>
        {#if editing}
          <ChipsInput bind:tags />
        {:else}
          <TagList {tags} />
        {/if}
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

      {#if editing}
        <div class="flex gap-2">
          <button onclick={apply} disabled={saving} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
            {saving ? 'Applying…' : 'Apply'}
          </button>
          <button onclick={cancel} disabled={saving} class="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
            Cancel
          </button>
        </div>
      {/if}

      {#if data.body}
        <div class="pt-4 border-t border-gray-800">
          <p class="text-xs text-gray-500 mb-3">Progress Notes</p>
          <MarkdownViewer body={data.body} />
        </div>
      {/if}
    </div>

    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Time Entries <span class="text-gray-600 font-normal normal-case">— {data.totalHours}h total</span>
        </h2>
        <div class="flex gap-2">
          <a href="/time?task={data.task.id}" class="text-xs text-gray-500 hover:text-gray-300">See all</a>
          <button onclick={() => (showLogForm = !showLogForm)} class="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">
            {showLogForm ? 'Cancel' : '+ Log'}
          </button>
        </div>
      </div>

      {#if showLogForm}
        <div class="mb-4">
          <TimeEntryForm
            taskId={data.task.id}
            projectId={data.task.project_id}
            onSuccess={handleLogSuccess}
          />
        </div>
      {/if}

      {#if data.timeEntries.length > 0}
        <table class="w-full text-sm mb-2">
          <thead>
            <tr class="text-gray-500 text-left text-xs">
              <th class="pb-2 font-normal">Date</th>
              <th class="pb-2 font-normal">Description</th>
              <th class="pb-2 font-normal text-right">Hours</th>
              <th class="pb-2 font-normal">Category</th>
            </tr>
          </thead>
          <tbody>
            {#each data.timeEntries as entry (entry.id)}
              <TimeEntryRow {entry} showTask={false} showProject={false} />
            {/each}
          </tbody>
        </table>
      {:else}
        <p class="text-gray-600 text-xs mb-4">No time logged yet.</p>
      {/if}
    </div>
  </div>
</div>
