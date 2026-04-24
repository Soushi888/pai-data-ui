<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import TagList from '$lib/components/shared/TagList.svelte'
  import ChipsInput from '$lib/components/shared/ChipsInput.svelte'
  import MarkdownViewer from '$lib/components/shared/MarkdownViewer.svelte'

  let { data } = $props()

  let editing = $state(false)
  let name = $state(data.org.name)
  let domain = $state(data.org.domain)
  let phone = $state(data.org.phone ?? '')
  let address = $state(data.org.address ?? '')
  let status = $state(data.org.status)
  let tags = $state<string[]>(data.org.tags ?? [])
  let saving = $state(false)
  let saved = $state(false)
  let snapshot: { name: string; domain: string; phone: string; address: string; status: 'active' | 'inactive'; tags: string[] } | null = null

  const inputClass = () =>
    `border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none transition-colors ${editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default'}`

  const selectClass = () =>
    `border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none transition-colors ${editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default appearance-none'}`

  function startEdit() {
    snapshot = { name, domain, phone, address, status, tags: [...tags] }
    editing = true
  }

  function cancel() {
    if (snapshot) {
      ;({ name, domain, phone, address, status } = snapshot)
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
    await fetch(`/api/organizations/${data.org.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, domain, status,
        phone: phone || undefined,
        address: address || undefined,
        tags
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
    <a href="/crm/organizations" class="text-gray-500 hover:text-gray-300 text-sm">← Organizations</a>
    <h1 class="text-xl font-semibold text-gray-100">{data.org.name}</h1>
    <StatusBadge status={data.org.status} />
    <div class="ml-auto flex gap-2">
      <a href="/crm/organizations/{data.org.id}/edit" class="text-xs px-3 py-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">Edit Raw</a>
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
      <div>
        <label class="text-xs text-gray-500 block mb-1">Name</label>
        <input bind:value={name} readonly={!editing} class={inputClass()} />
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Domain</label>
        <input bind:value={domain} readonly={!editing} class={inputClass()} />
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Phone</label>
        <input bind:value={phone} readonly={!editing} class={inputClass()} />
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Status</label>
        <select bind:value={status} disabled={!editing} class={selectClass()}>
          <option>active</option><option>inactive</option>
        </select>
      </div>
      <div class="col-span-4">
        <label class="text-xs text-gray-500 block mb-1">Address</label>
        <textarea bind:value={address} rows="2" readonly={!editing} class="border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none resize-none transition-colors {editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default'}"></textarea>
      </div>
      <div class="col-span-4">
        <label class="text-xs text-gray-500 block mb-1">Tags</label>
        {#if editing}
          <ChipsInput bind:tags />
        {:else}
          <TagList {tags} />
        {/if}
      </div>
    </div>

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
  </div>

  {#if data.body}
    <div class="mt-8 pt-6 border-t border-gray-700">
      <p class="text-xs text-gray-500 mb-4">Notes</p>
      <MarkdownViewer body={data.body} />
    </div>
  {/if}
</div>
