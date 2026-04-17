<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'

  let { data } = $props()

  let name = $state(data.org.name)
  let domain = $state(data.org.domain)
  let phone = $state(data.org.phone ?? '')
  let address = $state(data.org.address ?? '')
  let status = $state(data.org.status)
  let tags = $state((data.org.tags ?? []).join(', '))
  let saving = $state(false)
  let saved = $state(false)

  async function save() {
    saving = true
    await fetch(`/api/organizations/${data.org.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, domain, status,
        phone: phone || undefined,
        address: address || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
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
  </div>

  <div class="grid grid-cols-3 gap-6">
    <div class="col-span-2 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs text-gray-500 block mb-1">Name</label>
          <input bind:value={name} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Domain</label>
          <input bind:value={domain} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Phone</label>
          <input bind:value={phone} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Status</label>
          <select bind:value={status} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full">
            <option>active</option><option>inactive</option>
          </select>
        </div>
        <div class="col-span-2">
          <label class="text-xs text-gray-500 block mb-1">Address</label>
          <textarea bind:value={address} rows="3" class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full resize-none"></textarea>
        </div>
        <div class="col-span-2">
          <label class="text-xs text-gray-500 block mb-1">Tags</label>
          <input bind:value={tags} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
        </div>
      </div>
      <button onclick={save} disabled={saving} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
      </button>
    </div>

    <div>
      <label class="text-xs text-gray-500 block mb-1">Notes</label>
      <textarea rows="14" value={data.body} readonly class="bg-gray-800 border border-gray-700 text-gray-300 rounded px-3 py-2 text-sm font-mono w-full resize-none focus:outline-none"></textarea>
    </div>
  </div>
</div>
