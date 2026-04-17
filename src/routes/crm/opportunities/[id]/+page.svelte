<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'

  let { data } = $props()

  let title = $state(data.opp.title)
  let organization = $state(data.opp.organization)
  let status = $state(data.opp.status)
  let value_cad = $state(data.opp.value_cad ?? '')
  let tags = $state((data.opp.tags ?? []).join(', '))
  let notes = $state(data.opp.notes ?? '')
  let saving = $state(false)
  let saved = $state(false)

  async function save() {
    saving = true
    await fetch(`/api/opportunities/${data.opp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, organization, status,
        value_cad: value_cad ? Number(value_cad) : undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        notes: notes || undefined
      })
    })
    saving = false
    saved = true
    setTimeout(() => (saved = false), 2000)
  }
</script>

<div class="p-6 max-w-4xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/crm/opportunities" class="text-gray-500 hover:text-gray-300 text-sm">← Opportunities</a>
    <h1 class="text-xl font-semibold text-gray-100">{data.opp.title}</h1>
    <StatusBadge status={data.opp.status} />
  </div>

  <div class="grid grid-cols-3 gap-6">
    <div class="col-span-2 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs text-gray-500 block mb-1">Title</label>
          <input bind:value={title} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Organization</label>
          <input bind:value={organization} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Status</label>
          <select bind:value={status} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full">
            <option>prospect</option><option>active</option><option>won</option><option>lost</option><option>on-hold</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Value (CAD)</label>
          <input type="number" bind:value={value_cad} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
        </div>
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Tags</label>
        <input bind:value={tags} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Notes</label>
        <input bind:value={notes} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
      </div>
      <div class="flex gap-2">
        <button onclick={save} disabled={saving} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
        <a href="/pm/projects/new?from={data.opp.id}" class="bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded transition-colors">
          Promote to Project
        </a>
      </div>
    </div>

    <div>
      <label class="text-xs text-gray-500 block mb-1">Context</label>
      <textarea rows="14" value={data.body} readonly class="bg-gray-800 border border-gray-700 text-gray-300 rounded px-3 py-2 text-sm font-mono w-full resize-none focus:outline-none"></textarea>
    </div>
  </div>
</div>
