<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'

  let { data } = $props()

  let typeFilter = $state('all')

  const filtered = $derived(
    typeFilter === 'all'
      ? data.projects
      : data.projects.filter((p) => p.project_type === typeFilter)
  )
</script>

<div class="p-6 max-w-5xl">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-xl font-semibold text-gray-100">Projects</h1>
    <a href="/pm/projects/new" class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors">+ New</a>
  </div>

  <div class="flex gap-1 mb-4">
    {#each ['all', 'client', 'ovn', 'r&d'] as t}
      <button onclick={() => (typeFilter = t)}
        class="px-3 py-1.5 rounded text-xs transition-colors {typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
      >{t}</button>
    {/each}
  </div>

  <table class="w-full text-sm">
    <thead>
      <tr class="text-gray-500 text-left">
        <th class="pb-2 font-normal">Title</th>
        <th class="pb-2 font-normal">Type</th>
        <th class="pb-2 font-normal">Status</th>
        <th class="pb-2 font-normal">Organization</th>
        <th class="pb-2 font-normal">Updated</th>
      </tr>
    </thead>
    <tbody>
      {#each filtered as proj}
        <tr class="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer" onclick={() => window.location.href = `/pm/projects/${proj.id}`}>
          <td class="py-2.5 text-blue-400 font-medium">{proj.title}</td>
          <td class="py-2.5"><StatusBadge status={proj.project_type} /></td>
          <td class="py-2.5"><StatusBadge status={proj.status} /></td>
          <td class="py-2.5 text-gray-400">{proj.organization ?? '—'}</td>
          <td class="py-2.5 text-gray-500 tabular-nums">{proj.updated}</td>
        </tr>
      {:else}
        <tr><td colspan="5" class="py-8 text-center text-gray-500">No projects yet. <a href="/pm/projects/new" class="text-blue-400">Create one</a>.</td></tr>
      {/each}
    </tbody>
  </table>
</div>
