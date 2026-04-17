<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'

  let { data } = $props()

  const typeHref: Record<string, (id: string) => string> = {
    contact: (id) => `/crm/contacts/${id}`,
    opportunity: (id) => `/crm/opportunities/${id}`,
    organization: (id) => `/crm/organizations/${id}`,
    invoice: (id) => `/erp/invoices/${id}`,
    project: (id) => `/pm/projects/${id}`,
    task: (id) => `/pm/tasks/${id}`
  }

  const grouped = $derived(
    data.results.reduce((acc: Record<string, typeof data.results>, r) => {
      acc[r.type] = acc[r.type] ?? []
      acc[r.type].push(r)
      return acc
    }, {})
  )
</script>

<div class="p-6 max-w-3xl">
  <h1 class="text-xl font-semibold text-gray-100 mb-2">
    Search: <span class="text-blue-400">"{data.q}"</span>
  </h1>
  <p class="text-gray-500 text-sm mb-6">{data.results.length} result{data.results.length !== 1 ? 's' : ''}</p>

  {#if data.results.length === 0}
    <p class="text-gray-500">No results found.</p>
  {/if}

  {#each Object.entries(grouped) as [type, results]}
    <div class="mb-6">
      <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {type === 'opportunity' ? 'opportunities' : type === 'organization' ? 'organizations' : `${type}s`}
      </h2>
      <div class="space-y-1">
        {#each results as result}
          <a href={typeHref[type]?.(result.id) ?? '#'} class="flex items-center gap-3 p-3 rounded bg-gray-900/50 hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-700">
            <StatusBadge status={type} />
            <span class="text-gray-200 font-medium text-sm">{result.title}</span>
            <span class="text-gray-500 text-xs">{result.excerpt}</span>
          </a>
        {/each}
      </div>
    </div>
  {/each}
</div>
