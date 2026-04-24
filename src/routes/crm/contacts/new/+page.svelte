<script lang="ts">
  import { goto } from '$app/navigation'

  let name = $state('')
  let organization = $state('')
  let role = $state('')
  let status = $state<'active' | 'inactive' | 'prospect'>('active')
  let email = $state('')
  let tags = $state('')
  let saving = $state(false)
  let error = $state('')

  async function submit(e: Event) {
    e.preventDefault()
    saving = true
    error = ''
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        organization,
        role,
        status,
        email: email || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        last_contact: new Date().toISOString().split('T')[0]
      })
    })
    const json = await res.json()
    if (json.contact?.id) {
      goto(`/crm/contacts/${json.contact.id}`)
    } else {
      error = json.message ?? 'Failed to create contact'
      saving = false
    }
  }
</script>

<div class="p-6 max-w-xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/crm" class="text-gray-500 hover:text-gray-300 text-sm">← Contacts</a>
    <h1 class="text-xl font-semibold text-gray-100">New Contact</h1>
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form onsubmit={submit} onkeydown={(e) => { if (e.ctrlKey && e.key === 'Enter') e.currentTarget.requestSubmit() }} class="space-y-4">
    <div>
      <label class="text-xs text-gray-500 block mb-1">Name *</label>
      <input bind:value={name} required class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Organization *</label>
        <input bind:value={organization} required class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Role *</label>
        <input bind:value={role} required class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Status</label>
        <select bind:value={status} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full">
          <option value="active">active</option>
          <option value="prospect">prospect</option>
          <option value="inactive">inactive</option>
        </select>
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Email</label>
        <input bind:value={email} type="email" class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
      </div>
    </div>
    <div>
      <label class="text-xs text-gray-500 block mb-1">Tags (comma-separated)</label>
      <input bind:value={tags} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
    </div>
    {#if error}
      <p class="text-red-400 text-xs">{error}</p>
    {/if}
    <button type="submit" disabled={saving || !name || !organization || !role} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
      {saving ? 'Creating…' : 'Create Contact'}
    </button>
  </form>
</div>
