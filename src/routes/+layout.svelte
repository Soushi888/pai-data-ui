<script lang="ts">
  import '../app.css'
  import { page } from '$app/stores'

  let { data, children } = $props()

  const navSections = [
    {
      label: 'CRM',
      items: [
        { href: '/crm', label: 'Contacts', count: () => data.counts.contacts },
        { href: '/crm/opportunities', label: 'Opportunities', count: () => data.counts.opportunities },
        { href: '/crm/organizations', label: 'Organizations', count: () => data.counts.organizations }
      ]
    },
    {
      label: 'ERP',
      items: [
        { href: '/erp', label: 'Invoices', count: () => data.counts.invoices },
        { href: '/erp/stats', label: 'Stats', count: () => null }
      ]
    },
    {
      label: 'PM',
      items: [
        { href: '/pm', label: 'Active Projects', count: () => data.counts.projects },
        { href: '/pm/tasks', label: 'Tasks', count: () => data.counts.tasks }
      ]
    }
  ]

  let searchQuery = $state('')

  function handleSearch(e: Event) {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  function isActive(href: string): boolean {
    if (href === '/pm') return $page.url.pathname.startsWith('/pm')
    return $page.url.pathname.startsWith(href)
  }
</script>

<div class="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
  <aside class="w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
    <div class="p-4 border-b border-gray-800">
      <a href="/" class="text-blue-400 font-bold text-lg tracking-tight hover:text-blue-300">
        PAI Data
      </a>
      <p class="text-gray-500 text-xs mt-0.5">Personal AI Infrastructure</p>
    </div>

    <form onsubmit={handleSearch} class="p-3 border-b border-gray-800">
      <input
        type="search"
        bind:value={searchQuery}
        placeholder="Search…"
        class="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-500"
      />
    </form>

    <nav class="flex-1 overflow-y-auto p-2">
      <a
        href="/"
        class="flex items-center px-2 py-1.5 rounded text-sm transition-colors mb-3
          {$page.url.pathname === '/'
            ? 'bg-blue-900/50 text-blue-300'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}"
      >
        Dashboard
      </a>
      {#each navSections as section}
        <div class="mb-4">
          <p class="text-gray-500 text-xs font-semibold uppercase tracking-wider px-2 mb-1">
            {section.label}
          </p>
          {#each section.items as item}
            {@const count = item.count()}
            <a
              href={item.href}
              class="flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors
                {isActive(item.href)
                  ? 'bg-blue-900/50 text-blue-300'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}"
            >
              <span>{item.label}</span>
              {#if count !== null}
                <span class="text-xs text-gray-500 tabular-nums">{count}</span>
              {/if}
            </a>
          {/each}
        </div>
      {/each}
    </nav>
  </aside>

  <main class="flex-1 overflow-y-auto">
    {@render children()}
  </main>
</div>
