<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import TagList from '$lib/components/shared/TagList.svelte'
  import ChipsInput from '$lib/components/shared/ChipsInput.svelte'
  import { invalidateAll } from '$app/navigation'

  let { data } = $props()

  let editing = $state(false)
  let title = $state(data.project.title)
  let project_type = $state(data.project.project_type)
  let status = $state(data.project.status)
  let organization = $state(data.project.organization ?? '')
  let tags = $state<string[]>(data.project.tags ?? [])
  let body = $state(data.body)
  let saving = $state(false)
  let saved = $state(false)

  let newTaskTitle = $state('')
  let newTaskPriority = $state('medium')
  let addingTask = $state(false)

  const inputClass = () =>
    `border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none transition-colors ${editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default'}`

  const selectClass = () =>
    `border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none transition-colors ${editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default appearance-none'}`

  async function save() {
    saving = true
    await fetch(`/api/projects/${data.project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, project_type, status,
        organization: organization || undefined,
        tags
      })
    })
    saving = false
    saved = true
    setTimeout(() => (saved = false), 2000)
  }

  async function archive() {
    saving = true
    await fetch(`/api/projects/${data.project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' })
    })
    status = 'archived'
    saving = false
  }

  async function addTask(e: Event) {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    addingTask = true
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: data.project.id,
        title: newTaskTitle.trim(),
        status: 'todo',
        priority: newTaskPriority
      })
    })
    newTaskTitle = ''
    addingTask = false
    await invalidateAll()
  }

  const statusOrder = ['in-progress', 'blocked', 'todo', 'done']
  const sortedTasks = $derived(
    [...data.tasks].sort((a, b) =>
      statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
    )
  )
</script>

<div class="p-6 max-w-5xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/pm/projects" class="text-gray-500 hover:text-gray-300 text-sm">← Projects</a>
    <h1 class="text-xl font-semibold text-gray-100">{data.project.title}</h1>
    <StatusBadge status={data.project.status} />
    <StatusBadge status={data.project.project_type} />
    <div class="ml-auto flex gap-2">
      <a href="/pm/projects/{data.project.id}/edit" class="text-xs px-3 py-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">Edit Raw</a>
      <button
        onclick={() => (editing = !editing)}
        class="text-xs px-3 py-1.5 rounded transition-colors {editing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
      >{editing ? 'Done editing' : 'Edit'}</button>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-6 mb-8">
    <div class="col-span-2 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs text-gray-500 block mb-1">Title</label>
          <input bind:value={title} readonly={!editing} class={inputClass()} />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Organization</label>
          <input bind:value={organization} readonly={!editing} class={inputClass()} />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Type</label>
          <select bind:value={project_type} disabled={!editing} class={selectClass()}>
            <option value="client">client</option><option value="ovn">ovn</option><option value="r&d">r&d</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Status</label>
          <select bind:value={status} disabled={!editing} class={selectClass()}>
            <option>active</option><option>on-hold</option><option>completed</option><option>archived</option>
          </select>
        </div>
      </div>
      {#if data.project.opportunity_ref}
        <p class="text-xs text-gray-500">
          Opportunity: <a href="/crm/opportunities/{data.project.opportunity_ref}" class="text-blue-400 hover:text-blue-300">{data.project.opportunity_ref}</a>
        </p>
      {/if}
      {#if (data.project.external_refs ?? []).length > 0}
        <div>
          <p class="text-xs text-gray-500 mb-1">External refs</p>
          {#each data.project.external_refs ?? [] as ref}
            <a href={ref.url} target="_blank" class="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-1">
              <span class="font-mono bg-gray-800 px-1 rounded">{ref.system.toUpperCase()}</span>
              {ref.label ?? ref.id}
            </a>
          {/each}
        </div>
      {/if}
      <div>
        <label class="text-xs text-gray-500 block mb-1">Tags</label>
        {#if editing}
          <ChipsInput bind:tags />
        {:else}
          <TagList {tags} />
        {/if}
      </div>
      {#if editing}
        <div class="flex gap-2">
          <button onclick={save} disabled={saving} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
          </button>
          {#if status !== 'archived'}
            <button onclick={archive} disabled={saving} class="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
              Archive
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <div>
      <label class="text-xs text-gray-500 block mb-1">Overview</label>
      <textarea bind:value={body} rows="14" class="bg-gray-800 border border-gray-700 text-gray-300 rounded px-3 py-2 text-sm font-mono w-full resize-none focus:outline-none"></textarea>
    </div>
  </div>

  <!-- Tasks -->
  <div>
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Tasks ({data.tasks.length})</h2>

    <table class="w-full text-sm mb-4">
      <tbody>
        {#each sortedTasks as task}
          <tr class="border-t border-gray-800 hover:bg-gray-800/50">
            <td class="py-2 w-28"><StatusBadge status={task.status} /></td>
            <td class="py-2">
              <a href="/pm/tasks/{task.id}" class="text-gray-300 hover:text-blue-300">{task.title}</a>
            </td>
            <td class="py-2 w-12 text-xs text-gray-600">{task.t_shirt_size ?? ''}</td>
            <td class="py-2 w-24"><StatusBadge status={task.priority} /></td>
          </tr>
        {:else}
          <tr><td colspan="4" class="py-4 text-gray-600 text-xs">No tasks yet.</td></tr>
        {/each}
      </tbody>
    </table>

    <form onsubmit={addTask} class="flex gap-2">
      <input
        bind:value={newTaskTitle}
        placeholder="New task title…"
        class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 flex-1"
      />
      <select bind:value={newTaskPriority} class="bg-gray-800 border border-gray-700 text-gray-400 rounded px-3 py-2 text-sm focus:outline-none">
        <option value="low">low</option><option value="medium" selected>medium</option><option value="high">high</option><option value="critical">critical</option>
      </select>
      <button type="submit" disabled={addingTask || !newTaskTitle.trim()} class="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
        + Add
      </button>
    </form>
  </div>
</div>
