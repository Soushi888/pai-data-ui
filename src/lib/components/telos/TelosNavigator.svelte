<script lang="ts">
  import TelosFileNode from './TelosFileNode.svelte'
  import type { TelosFileEntry } from '$lib/server/telos.js'

  interface Props {
    files: TelosFileEntry[]
    currentFile: string
  }

  let { files, currentFile }: Props = $props()

  const grouped = $derived(() => {
    const map = new Map<string, TelosFileEntry[]>()
    for (const entry of files) {
      if (!map.has(entry.category)) map.set(entry.category, [])
      map.get(entry.category)!.push(entry)
    }
    return map
  })
</script>

<nav
  class="w-[220px] flex-shrink-0 flex flex-col overflow-y-auto border-r"
  style="background: var(--athanor-surface); border-color: var(--athanor-border);"
>
  <div class="px-3 py-3 border-b" style="border-color: var(--athanor-border);">
    <p class="text-xs font-semibold tracking-widest uppercase" style="color: var(--athanor-gold);">
      TELOS
    </p>
    <p class="text-[10px] mt-0.5" style="color: var(--athanor-mist);">Life Operating System</p>
  </div>

  <div class="flex-1 p-2 space-y-4">
    {#each [...grouped()] as [category, entries]}
      <div>
        <p
          class="text-[10px] font-semibold uppercase tracking-wider px-2 mb-1"
          style="color: var(--athanor-ember);"
        >
          {category}
        </p>
        <div class="space-y-0.5">
          {#each entries as entry}
            <TelosFileNode
              file={entry.file}
              active={entry.file === currentFile}
              exists={entry.exists}
            />
          {/each}
        </div>
      </div>
    {/each}
  </div>
</nav>
