<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'

  let { data } = $props()

  const total = $derived(
    data.contacts.length +
    data.opportunities.length +
    data.organizations.length +
    data.projects.length +
    data.tasks.length +
    data.invoices.length
  )
</script>

<div class="p-6 max-w-4xl">
  <div class="mb-6">
    <h1 class="text-xl font-semibold text-gray-100 mb-1">
      Tag: <span class="text-blue-400">{data.tag}</span>
    </h1>
    <p class="text-gray-500 text-sm">{total} item{total !== 1 ? 's' : ''}</p>
  </div>

  {#if total === 0}
    <p class="text-gray-500 text-sm">No items found with this tag.</p>
  {:else}
    {#if data.contacts.length}
      <section class="mb-6">
        <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Contacts ({data.contacts.length})
        </h2>
        <div class="space-y-0.5">
          {#each data.contacts as c}
            <a
              href="/crm/contacts/{c.id}"
              class="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-800 group"
            >
              <span class="text-blue-400 group-hover:text-blue-300 text-sm">{c.name}</span>
              {#if c.organization}
                <span class="text-gray-600 text-xs">·</span>
                <span class="text-gray-500 text-xs">{c.organization}</span>
              {/if}
              <StatusBadge status={c.status} />
            </a>
          {/each}
        </div>
      </section>
    {/if}

    {#if data.opportunities.length}
      <section class="mb-6">
        <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Opportunities ({data.opportunities.length})
        </h2>
        <div class="space-y-0.5">
          {#each data.opportunities as o}
            <a
              href="/crm/opportunities/{o.id}"
              class="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-800 group"
            >
              <span class="text-blue-400 group-hover:text-blue-300 text-sm">{o.title}</span>
              {#if o.organization}
                <span class="text-gray-600 text-xs">·</span>
                <span class="text-gray-500 text-xs">{o.organization}</span>
              {/if}
              <StatusBadge status={o.status} />
            </a>
          {/each}
        </div>
      </section>
    {/if}

    {#if data.organizations.length}
      <section class="mb-6">
        <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Organizations ({data.organizations.length})
        </h2>
        <div class="space-y-0.5">
          {#each data.organizations as org}
            <a
              href="/crm/organizations/{org.id}"
              class="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-800 group"
            >
              <span class="text-blue-400 group-hover:text-blue-300 text-sm">{org.name}</span>
              {#if org.domain}
                <span class="text-gray-600 text-xs">·</span>
                <span class="text-gray-500 text-xs">{org.domain}</span>
              {/if}
              <StatusBadge status={org.status} />
            </a>
          {/each}
        </div>
      </section>
    {/if}

    {#if data.projects.length}
      <section class="mb-6">
        <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Projects ({data.projects.length})
        </h2>
        <div class="space-y-0.5">
          {#each data.projects as p}
            <a
              href="/pm/projects/{p.id}"
              class="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-800 group"
            >
              <span class="text-blue-400 group-hover:text-blue-300 text-sm">{p.title}</span>
              {#if p.organization}
                <span class="text-gray-600 text-xs">·</span>
                <span class="text-gray-500 text-xs">{p.organization}</span>
              {/if}
              <StatusBadge status={p.status} />
            </a>
          {/each}
        </div>
      </section>
    {/if}

    {#if data.tasks.length}
      <section class="mb-6">
        <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Tasks ({data.tasks.length})
        </h2>
        <div class="space-y-0.5">
          {#each data.tasks as t}
            <a
              href="/pm/tasks/{t.id}"
              class="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-800 group"
            >
              <span class="text-blue-400 group-hover:text-blue-300 text-sm">{t.title}</span>
              {#if t.epic}
                <span class="text-gray-600 text-xs">·</span>
                <span class="text-gray-500 text-xs">{t.epic}</span>
              {/if}
              <StatusBadge status={t.status} />
            </a>
          {/each}
        </div>
      </section>
    {/if}

    {#if data.invoices.length}
      <section class="mb-6">
        <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Invoices ({data.invoices.length})
        </h2>
        <div class="space-y-0.5">
          {#each data.invoices as inv}
            <a
              href="/erp/invoices/{inv.id}"
              class="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-800 group"
            >
              <span class="text-blue-400 group-hover:text-blue-300 text-sm">{inv.number}</span>
              {#if inv.organization}
                <span class="text-gray-600 text-xs">·</span>
                <span class="text-gray-500 text-xs">{inv.organization}</span>
              {/if}
              <StatusBadge status={inv.status} />
            </a>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>
