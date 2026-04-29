<script lang="ts">
  /**
   * Main navigation sidebar with section links and global search.
   * @component
   */

    import { page } from "$app/stores";

    interface Counts {
        contacts: number;
        opportunities: number;
        organizations: number;
        invoices: number;
        projects: number;
        tasks: number;
        expenses: number;
        income: number;
        vfEvents: number;
    }

    interface Props {
        /** Entity counts shown next to each nav item. */
        counts: Counts;
    }

    let { counts }: Props = $props();

    const navSections = [
        {
            label: "CRM",
            items: [
                { href: "/crm", label: "Contacts", count: () => counts.contacts },
                { href: "/crm/opportunities", label: "Opportunities", count: () => counts.opportunities },
                { href: "/crm/organizations", label: "Organizations", count: () => counts.organizations },
            ],
        },
        {
            label: "ERP",
            items: [
                { href: "/erp/expenses", label: "Expenses", count: () => counts.expenses },
                { href: "/erp/payments", label: "Payments", count: () => null },
                { href: "/erp/income", label: "Income", count: () => counts.income },
                { href: "/erp", label: "Invoices", count: () => counts.invoices },
                { href: "/erp/stats", label: "Stats", count: () => null },
            ],
        },
        {
            label: "Project Management",
            items: [
                { href: "/pm", label: "Active Projects", count: () => counts.projects },
                { href: "/pm/tasks", label: "Tasks", count: () => counts.tasks },
                { href: "/pm/focus", label: "Focus", count: () => null },
            ],
        },
        {
            label: "ValueFlows",
            items: [
                { href: "/vf", label: "Dashboard", count: () => counts.vfEvents },
                { href: "/vf/balance", label: "Balance", count: () => null },
            ],
        },
    ];

    let searchQuery = $state("");
    let searchInput = $state<HTMLInputElement | null>(null);

    function handleSearch(e: Event) {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
        }
    }

    function onGlobalKeydown(e: KeyboardEvent) {
        if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            searchInput?.focus();
            searchInput?.select();
        }
    }

    function isActive(href: string): boolean {
        const pathname = $page.url.pathname;
        const allHrefs = ["/"].concat(
            navSections.flatMap((s) => s.items.map((i) => i.href)),
        );
        const bestMatch = allHrefs
            .filter(
                (h) =>
                    pathname === h ||
                    (h !== "/" && pathname.startsWith(h + "/")),
            )
            .sort((a, b) => b.length - a.length)[0];
        return bestMatch === href;
    }
</script>

<svelte:window onkeydown={onGlobalKeydown} />

<aside class="w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
    <div class="p-4 border-b border-gray-800">
        <a
            href="/"
            class="text-blue-400 font-bold text-lg tracking-tight hover:text-blue-300"
        >
            PAI Data
        </a>
        <p class="text-gray-500 text-xs mt-0.5">Personal AI Infrastructure</p>
    </div>

    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <form
        onsubmit={handleSearch}
        onkeydown={(e) => { if (e.ctrlKey && e.key === "Enter") e.currentTarget.requestSubmit(); }}
        class="p-3 border-b border-gray-800"
    >
        <input
            bind:this={searchInput}
            type="search"
            bind:value={searchQuery}
            placeholder="Search… (Ctrl+K)"
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
                <p class="text-gray-600 text-xs font-semibold uppercase tracking-wider px-2 mb-1">
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
