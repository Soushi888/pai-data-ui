<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import TagList from '$lib/components/shared/TagList.svelte'

  let { data } = $props()

  let statusFilter = $state('active')
  let selectedTags = $state<string[]>([])
  let search = $state('')

  const filtered = $derived(
    data.contacts.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (selectedTags.length > 0 && !selectedTags.every((t) => c.tags?.includes(t))) return false
      if (search && !`${c.name} ${c.organization} ${c.role}`.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  )

  function toggleTag(tag: string) {
    selectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
  }
</script>

<div class="p-6 max-w-6xl">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-xl font-semibold text-gray-100">Contacts <span class="text-gray-500 font-normal text-base">({filtered.length})</span></h1>
    <a href="/crm/contacts/new" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded transition-colors">+ New Contact</a>
  </div>

  <!-- Filters -->
  <div class="flex gap-4 mb-4 flex-wrap items-center">
    <input
      type="search"
      bind:value={search}
      placeholder="Search contacts…"
      class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-64"
    />
    <div class="flex gap-1">
      {#each ['all', 'active', 'inactive', 'prospect'] as s}
        <button
          onclick={() => (statusFilter = s)}
          class="px-3 py-1.5 rounded text-xs transition-colors {statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
        >{s}</button>
      {/each}
    </div>
  </div>

  <!-- Tag filter -->
  {#if data.allTags.length > 0}
    <div class="flex flex-wrap gap-1 mb-4">
      {#each data.allTags as tag}
        <button
          onclick={() => toggleTag(tag)}
          class="px-2 py-0.5 rounded text-xs transition-colors {selectedTags.includes(tag) ? 'bg-blue-800/60 text-blue-200' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
        >{tag}</button>
      {/each}
    </div>
  {/if}

  <!-- Table -->
  <table class="w-full text-sm">
    <thead>
      <tr class="text-gray-500 text-left">
        <th class="pb-2 font-normal">Name</th>
        <th class="pb-2 font-normal">Organization</th>
        <th class="pb-2 font-normal">Status</th>
        <th class="pb-2 font-normal whitespace-nowrap">Last Contact</th>
        <th class="pb-2 font-normal">Tags</th>
      </tr>
    </thead>
    <tbody>
      {#each filtered as contact}
        <tr class="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer" onclick={() => window.location.href = `/crm/contacts/${contact.id}`}>
          <td class="py-2.5 text-blue-400 font-medium">{contact.name}</td>
          <td class="py-2.5 text-gray-300">{contact.organization}</td>
          <td class="py-2.5"><StatusBadge status={contact.status} /></td>
          <td class="py-2.5 text-gray-500 tabular-nums whitespace-nowrap">{contact.last_contact ?? '—'}</td>
          <td class="py-2.5"><TagList tags={contact.tags ?? []} /></td>
        </tr>
      {:else}
        <tr><td colspan="5" class="py-8 text-center text-gray-500">No contacts match the current filters.</td></tr>
      {/each}
    </tbody>
  </table>
</div>
