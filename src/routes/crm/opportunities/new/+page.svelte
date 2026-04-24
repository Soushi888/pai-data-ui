<script lang="ts">
  import { goto } from '$app/navigation'
  import type { Opportunity } from '$lib/data/types.js'

  let title = $state('')
  let organization = $state('')
  let contact = $state('')
  let status = $state<Opportunity['status']>('prospect')
  let value_cad = $state('')
  let tags = $state('')
  let saving = $state(false)
  let error = $state('')

  async function submit(e: Event) {
    e.preventDefault()
    saving = true
    error = ''
    const res = await fetch('/api/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        organization,
        contact: contact || '',
        status,
        value_cad: value_cad ? parseFloat(value_cad) : undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
      })
    })
    const json = await res.json()
    if (json.opportunity?.id) {
      goto(`/crm/opportunities/${json.opportunity.id}`)
    } else {
      error = json.message ?? 'Failed to create opportunity'
      saving = false
    }
  }
</script>

<div class="p-6 max-w-xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/crm/opportunities" class="text-gray-500 hover:text-gray-300 text-sm">← Opportunities</a>
    <h1 class="text-xl font-semibold text-gray-100">New Opportunity</h1>
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form onsubmit={submit} onkeydown={(e) => { if (e.ctrlKey && e.key === 'Enter') e.currentTarget.requestSubmit() }} class="space-y-4">
    <div>
      <label class="text-xs text-gray-500 block mb-1">Title *</label>
      <input bind:value={title} required class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Organization *</label>
        <input bind:value={organization} required class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Contact</label>
        <input bind:value={contact} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Status</label>
        <select bind:value={status} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full">
          <option value="prospect">prospect</option>
          <option value="active">active</option>
          <option value="on-hold">on-hold</option>
          <option value="won">won</option>
          <option value="lost">lost</option>
        </select>
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Value (CAD)</label>
        <input bind:value={value_cad} type="number" min="0" step="0.01" class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
      </div>
    </div>
    <div>
      <label class="text-xs text-gray-500 block mb-1">Tags (comma-separated)</label>
      <input bind:value={tags} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
    </div>
    {#if error}
      <p class="text-red-400 text-xs">{error}</p>
    {/if}
    <button type="submit" disabled={saving || !title || !organization} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
      {saving ? 'Creating…' : 'Create Opportunity'}
    </button>
  </form>
</div>
