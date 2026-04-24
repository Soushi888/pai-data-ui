<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import TagList from '$lib/components/shared/TagList.svelte'
  import ChipsInput from '$lib/components/shared/ChipsInput.svelte'
  import MarkdownViewer from '$lib/components/shared/MarkdownViewer.svelte'

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
  let saving = $state(false)
  let saved = $state(false)
  let snapshot: { name: string; organization: string; role: string; status: 'active' | 'inactive' | 'prospect'; last_contact: string; email: string; github: string; timezone: string; tags: string[] } | null = null

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

  function startEdit() {
    snapshot = { name, organization, role, status, last_contact, email, github, timezone, tags: [...tags] }
    editing = true
  }

  function cancel() {
    if (snapshot) {
      ;({ name, organization, role, status, last_contact, email, github, timezone } = snapshot)
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

  function markContactedToday() {
    last_contact = new Date().toISOString().split('T')[0]
    save()
  }
</script>

<svelte:window onkeydown={(e) => { if (e.ctrlKey && e.key === 'Enter' && editing && !saving) apply() }} />

<div class="p-6 max-w-5xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/crm" class="text-gray-500 hover:text-gray-300 text-sm">← Contacts</a>
    <h1 class="text-xl font-semibold text-gray-100">{data.contact.name}</h1>
    <StatusBadge status={data.contact.status} />
    <div class="ml-auto flex gap-2">
      <a href="/crm/contacts/{data.contact.id}/edit" class="text-xs px-3 py-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">Edit Raw</a>
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
        <label class="text-xs text-gray-500 block mb-1">Organization</label>
        <input bind:value={organization} readonly={!editing} class={inputClass()} />
      </div>
      <div class="col-span-2">
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
        <button onclick={apply} disabled={saving} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
          {saving ? 'Applying…' : 'Apply'}
        </button>
        <button onclick={cancel} disabled={saving} class="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button onclick={markContactedToday} class="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded transition-colors">
          Mark contacted today
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
