<script lang="ts">
  import ForceGraph from './ForceGraph.svelte'
  import type { SkillCategory, SkillNode } from '$lib/data/skills.js'
  import type { PageData } from './$types.js'

  let { data }: { data: PageData } = $props()

  const CATEGORIES: SkillCategory[] = [
    'thinking',
    'implementation',
    'content',
    'meta',
    'personal',
    'analysis',
    'domain',
    'utility',
  ]

  const CATEGORY_COLORS: Record<SkillCategory, string> = {
    thinking: '#60a5fa',
    implementation: '#4ade80',
    content: '#c084fc',
    meta: '#fb923c',
    personal: '#f472b6',
    analysis: '#22d3ee',
    domain: '#facc15',
    utility: '#9ca3af',
  }

  let searchQuery = $state('')
  let activeCategories = $state(new Set<SkillCategory>())
  let selectedSkill = $state<SkillNode | null>(null)

  const highlightIds = $derived.by(() => {
    const hasSearch = searchQuery.trim().length > 0
    const hasFilter = activeCategories.size > 0
    if (!hasSearch && !hasFilter) return new Set<string>()

    const ids = new Set<string>()
    for (const node of data.graph.nodes) {
      const matchesSearch =
        !hasSearch || node.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      const matchesCategory = !hasFilter || activeCategories.has(node.category)
      if (matchesSearch && matchesCategory) ids.add(node.id)
    }
    return ids
  })

  function toggleCategory(cat: SkillCategory) {
    const next = new Set(activeCategories)
    if (next.has(cat)) next.delete(cat)
    else next.add(cat)
    activeCategories = next
  }

  function parseArgHint(hint: string | undefined): string[] {
    if (!hint) return []
    return hint
      .replace(/[\[\]]/g, '')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
  }
</script>

<div class="h-full flex flex-col overflow-hidden">
  <!-- Toolbar -->
  <div class="p-3 border-b border-gray-800 flex items-center gap-2 flex-shrink-0 flex-wrap">
    <span class="text-sm font-semibold text-gray-200">Skills</span>
    <span class="text-gray-600 text-xs">{data.graph.skillCount}</span>
    <input
      type="search"
      bind:value={searchQuery}
      placeholder="Filter skills…"
      class="bg-gray-800 text-gray-200 text-xs rounded px-2.5 py-1 border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-500 w-44"
    />
    <div class="flex gap-1 flex-wrap">
      {#each CATEGORIES as cat}
        <button
          type="button"
          onclick={() => toggleCategory(cat)}
          class="flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors {activeCategories.has(
            cat
          )
            ? 'bg-gray-700 border-gray-500 text-gray-200'
            : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'}"
        >
          <svg width="6" height="6" class="flex-shrink-0">
            <circle cx="3" cy="3" r="3" fill={CATEGORY_COLORS[cat]} />
          </svg>
          {cat}
        </button>
      {/each}
    </div>
    {#if activeCategories.size > 0 || searchQuery}
      <button
        type="button"
        onclick={() => {
          activeCategories = new Set()
          searchQuery = ''
        }}
        class="text-xs text-gray-500 hover:text-gray-300 ml-1"
      >
        clear
      </button>
    {/if}
  </div>

  <!-- Main area -->
  <div class="flex-1 flex overflow-hidden min-h-0">
    <!-- Graph -->
    <div class="flex-1 relative overflow-hidden bg-gray-950">
      <ForceGraph
        nodes={data.graph.nodes}
        links={data.graph.links}
        {highlightIds}
        onNodeClick={(node) => (selectedSkill = node)}
      />
    </div>

    <!-- Detail panel -->
    {#if selectedSkill}
      <aside
        class="w-72 border-l border-gray-800 bg-gray-900 flex flex-col flex-shrink-0 overflow-hidden"
      >
        <div class="p-4 border-b border-gray-800 flex items-start justify-between gap-2">
          <div>
            <h2 class="text-sm font-semibold text-gray-100">{selectedSkill.name}</h2>
            <span class="flex items-center gap-1.5 mt-1">
              <svg width="8" height="8">
                <circle
                  cx="4"
                  cy="4"
                  r="4"
                  fill={CATEGORY_COLORS[selectedSkill.category] ?? '#9ca3af'}
                />
              </svg>
              <span class="text-xs text-gray-400">{selectedSkill.category}</span>
            </span>
          </div>
          <button
            type="button"
            onclick={() => (selectedSkill = null)}
            class="text-gray-500 hover:text-gray-300 text-lg leading-none flex-shrink-0 mt-0.5"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          {#if selectedSkill.description}
            <p class="text-xs text-gray-400 leading-relaxed">{selectedSkill.description}</p>
          {/if}

          {#if selectedSkill.argumentHint}
            {@const args = parseArgHint(selectedSkill.argumentHint)}
            {#if args.length > 0}
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                  Arguments
                </p>
                <div class="flex flex-wrap gap-1">
                  {#each args as arg}
                    <span
                      class="text-xs bg-gray-800 text-gray-300 border border-gray-700 rounded px-1.5 py-0.5"
                    >
                      {arg}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </aside>
    {/if}
  </div>

  <!-- Legend -->
  <div
    class="px-4 py-2 border-t border-gray-800 flex flex-wrap gap-4 flex-shrink-0 bg-gray-900/50"
  >
    {#each CATEGORIES as cat}
      <span class="flex items-center gap-1.5 text-xs text-gray-500">
        <svg width="8" height="8">
          <circle cx="4" cy="4" r="4" fill={CATEGORY_COLORS[cat]} />
        </svg>
        {cat}
      </span>
    {/each}
    <span class="text-xs text-gray-600 ml-auto">scroll to zoom · drag to pan</span>
  </div>
</div>
