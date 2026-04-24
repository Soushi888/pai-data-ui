<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import TagList from '$lib/components/shared/TagList.svelte'
  import ChipsInput from '$lib/components/shared/ChipsInput.svelte'
  import MarkdownViewer from '$lib/components/shared/MarkdownViewer.svelte'

  let { data } = $props()

  let editing = $state(false)
  let title = $state(data.opp.title)
  let organization = $state(data.opp.organization)
  let status = $state(data.opp.status)
  let value_cad = $state(data.opp.value_cad ?? '')
  let tags = $state<string[]>(data.opp.tags ?? [])
  let description = $state(data.opp.description ?? '')
  let saving = $state(false)
  let saved = $state(false)
  let snapshot: { title: string; organization: string; status: 'prospect' | 'active' | 'won' | 'lost' | 'on-hold' | 'archived'; value_cad: number | string; tags: string[]; description: string } | null = null

  const inputClass = () =>
    `border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none transition-colors ${editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default'}`

  const selectClass = () =>
    `border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none transition-colors ${editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default appearance-none'}`

  async function archive() {
    saving = true
    await fetch(`/api/opportunities/${data.opp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' })
    })
    status = 'archived'
    saving = false
  }

  function startEdit() {
    snapshot = { title, organization, status, value_cad, tags: [...tags], description }
    editing = true
  }

  function cancel() {
    if (snapshot) {
      ;({ title, organization, status, value_cad, description } = snapshot)
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
    await fetch(`/api/opportunities/${data.opp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, organization, status,
        value_cad: value_cad ? Number(value_cad) : undefined,
        tags,
        description: description || undefined
      })
    })
    saving = false
    saved = true
    setTimeout(() => (saved = false), 2000)
  }
</script>

<svelte:window onkeydown={(e) => { if (e.ctrlKey && e.key === 'Enter' && editing && !saving) apply() }} />

<div class="p-6 max-w-5xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/crm/opportunities" class="text-gray-500 hover:text-gray-300 text-sm">← Opportunities</a>
    <h1 class="text-xl font-semibold text-gray-100">{data.opp.title}</h1>
    <StatusBadge status={data.opp.status} />
    <div class="ml-auto flex gap-2">
      <a href="/crm/opportunities/{data.opp.id}/edit" class="text-xs px-3 py-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">Edit Raw</a>
      {#if !editing}
        <button
          onclick={startEdit}
          class="text-xs px-3 py-1.5 rounded transition-colors bg-gray-800 text-gray-400 hover:bg-gray-700"
        >Edit</button>
      {/if}
    </div>
  </div>

  <div class="space-y-4">
    <div class="grid grid-cols-4 gap-4">
      <div class="col-span-2">
        <label class="text-xs text-gray-500 block mb-1">Title</label>
        <input bind:value={title} readonly={!editing} class={inputClass()} />
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Organization</label>
        <input bind:value={organization} readonly={!editing} class={inputClass()} />
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Status</label>
        <select bind:value={status} disabled={!editing} class={selectClass()}>
          <option>prospect</option><option>active</option><option>won</option><option>lost</option><option>on-hold</option><option>archived</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Value (CAD)</label>
        <input type="number" bind:value={value_cad} readonly={!editing} class={inputClass()} />
      </div>
      <div class="col-span-3">
        <label class="text-xs text-gray-500 block mb-1">Tags</label>
        {#if editing}
          <ChipsInput bind:tags />
        {:else}
          <TagList {tags} />
        {/if}
      </div>
    </div>

    <div>
      <label class="text-xs text-gray-500 block mb-1">Description</label>
      <input bind:value={description} readonly={!editing} class={inputClass()} />
    </div>

    {#if editing}
      <div class="flex gap-2">
        <button onclick={apply} disabled={saving} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
          {saving ? 'Applying…' : 'Apply'}
        </button>
        <button onclick={cancel} disabled={saving} class="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
          Cancel
        </button>
        {#if status !== 'archived'}
          <a href="/pm/projects/new?from={data.opp.id}" class="bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded transition-colors">
            Promote to Project
          </a>
          <button onclick={archive} disabled={saving} class="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
            Archive
          </button>
        {/if}
      </div>
    {/if}
  </div>

  {#if data.body}
    <div class="mt-8 pt-6 border-t border-gray-700">
      <p class="text-xs text-gray-500 mb-4">Context</p>
      <MarkdownViewer body={data.body} />
    </div>
  {/if}
</div>
