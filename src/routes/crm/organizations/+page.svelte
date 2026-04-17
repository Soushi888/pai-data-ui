<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import TagList from '$lib/components/shared/TagList.svelte'

  let { data } = $props()

  let statusFilter = $state('all')

  const filtered = $derived(
    statusFilter === 'all'
      ? data.organizations
      : data.organizations.filter((o) => o.status === statusFilter)
  )
</script>

<div class="p-6 max-w-5xl">
  <h1 class="text-xl font-semibold text-gray-100 mb-4">Organizations</h1>

  <div class="flex gap-1 mb-4">
    {#each ['all', 'active', 'inactive'] as s}
      <button onclick={() => (statusFilter = s)}
        class="px-3 py-1.5 rounded text-xs transition-colors {statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
      >{s}</button>
    {/each}
  </div>

  <table class="w-full text-sm">
    <thead>
      <tr class="text-gray-500 text-left">
        <th class="pb-2 font-normal">Name</th>
        <th class="pb-2 font-normal">Domain</th>
        <th class="pb-2 font-normal">Status</th>
        <th class="pb-2 font-normal">Tags</th>
      </tr>
    </thead>
    <tbody>
      {#each filtered as org}
        <tr class="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer" onclick={() => window.location.href = `/crm/organizations/${org.id}`}>
          <td class="py-2.5 text-blue-400 font-medium">{org.name}</td>
          <td class="py-2.5 text-gray-400">{org.domain}</td>
          <td class="py-2.5"><StatusBadge status={org.status} /></td>
          <td class="py-2.5"><TagList tags={org.tags ?? []} /></td>
        </tr>
      {:else}
        <tr><td colspan="4" class="py-8 text-center text-gray-500">No organizations found.</td></tr>
      {/each}
    </tbody>
  </table>
</div>
