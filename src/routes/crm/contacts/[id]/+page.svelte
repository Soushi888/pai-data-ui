<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import TagList from '$lib/components/shared/TagList.svelte'
  import ChipsInput from '$lib/components/shared/ChipsInput.svelte'

  let { data } = $props()

  let editing = $state(false)
  let name = $state(data.contact.name)
  let organization = $state(data.contact.organization)
  let role = $state(data.contact.role)
  let status = $state(data.contact.status)
  let last_contact = $state(data.contact.last_contact)
  let email = $state(data.contact.email ?? '')
  let github = $state(data.contact.github ?? '')
  let timezone = $state(data.contact.timezone ?? '')
  let tags = $state<string[]>(data.contact.tags ?? [])
  let body = $state(data.body)
  let saving = $state(false)
  let saved = $state(false)

  const inputClass = (extra = '') =>
    `bg-gray-800 border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none transition-colors ${extra} ${editing ? 'border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default'}`

  const selectClass = () =>
    `border text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none transition-colors ${editing ? 'bg-gray-800 border-gray-700 focus:border-blue-500' : 'border-transparent bg-transparent cursor-default appearance-none'}`

  async function save() {
    saving = true
    await fetch(`/api/contacts/${data.contact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, organization, role, status, last_contact,
        email: email || undefined,
        github: github || undefined,
        timezone: timezone || undefined,
        tags
      })
    })
    saving = false
    saved = true
    setTimeout(() => (saved = false), 2000)
  }

  function markContactedToday() {
    last_contact = new Date().toISOString().split('T')[0]
    save()
  }
</script>

<div class="p-6 max-w-5xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/crm" class="text-gray-500 hover:text-gray-300 text-sm">← Contacts</a>
    <h1 class="text-xl font-semibold text-gray-100">{data.contact.name}</h1>
    <StatusBadge status={data.contact.status} />
    <div class="ml-auto">
      <button
        onclick={() => (editing = !editing)}
        class="text-xs px-3 py-1.5 rounded transition-colors {editing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
      >{editing ? 'Done editing' : 'Edit'}</button>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-6">
    <!-- Form -->
    <div class="col-span-2 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs text-gray-500 block mb-1">Name</label>
          <input bind:value={name} readonly={!editing} class={inputClass()} />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Organization</label>
          <input bind:value={organization} readonly={!editing} class={inputClass()} />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Role</label>
          <input bind:value={role} readonly={!editing} class={inputClass()} />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Status</label>
          <select bind:value={status} disabled={!editing} class={selectClass()}>
            <option>active</option><option>inactive</option><option>prospect</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Last Contact</label>
          <input type="date" bind:value={last_contact} readonly={!editing} class={inputClass()} />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Email</label>
          <input type="email" bind:value={email} readonly={!editing} class={inputClass()} />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">GitHub</label>
          <input bind:value={github} readonly={!editing} class={inputClass()} />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Timezone</label>
          <input bind:value={timezone} readonly={!editing} class={inputClass()} />
        </div>
      </div>
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
          <button onclick={markContactedToday} class="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded transition-colors">
            Mark contacted today
          </button>
        </div>
      {/if}
    </div>

    <!-- Body -->
    <div>
      <label class="text-xs text-gray-500 block mb-1">Notes</label>
      <textarea bind:value={body} rows="16" class="bg-gray-800 border border-gray-700 text-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full font-mono resize-none" readonly></textarea>
    </div>
  </div>
</div>
