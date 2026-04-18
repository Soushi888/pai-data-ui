<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import TagList from '$lib/components/shared/TagList.svelte'
  import ChipsInput from '$lib/components/shared/ChipsInput.svelte'

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

  const inputClass = () =>
    `border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none transition-colors ${editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default'}`

  const selectClass = () =>
    `border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none transition-colors ${editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default appearance-none'}`

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

<div class="p-6 max-w-4xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/crm/organizations" class="text-gray-500 hover:text-gray-300 text-sm">← Organizations</a>
    <h1 class="text-xl font-semibold text-gray-100">{data.org.name}</h1>
    <StatusBadge status={data.org.status} />
    <div class="ml-auto">
      <button
        onclick={() => (editing = !editing)}
        class="text-xs px-3 py-1.5 rounded transition-colors {editing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
      >{editing ? 'Done editing' : 'Edit'}</button>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-6">
    <div class="col-span-2 space-y-4">
      <div class="grid grid-cols-2 gap-4">
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
        <div class="col-span-2">
          <label class="text-xs text-gray-500 block mb-1">Address</label>
          <textarea bind:value={address} rows="3" readonly={!editing} class="border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none resize-none transition-colors {editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default'}"></textarea>
        </div>
        <div class="col-span-2">
          <label class="text-xs text-gray-500 block mb-1">Tags</label>
          {#if editing}
            <ChipsInput bind:tags />
          {:else}
            <TagList {tags} />
          {/if}
        </div>
      </div>
      {#if editing}
        <button onclick={save} disabled={saving} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      {/if}
    </div>

    <div>
      <label class="text-xs text-gray-500 block mb-1">Notes</label>
      <textarea rows="14" value={data.body} readonly class="bg-gray-800 border border-gray-700 text-gray-300 rounded px-3 py-2 text-sm font-mono w-full resize-none focus:outline-none"></textarea>
    </div>
  </div>
</div>
