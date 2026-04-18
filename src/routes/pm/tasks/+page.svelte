<script lang="ts">
  import KanbanColumn from '$lib/components/shared/KanbanColumn.svelte'
  import TaskCard from '$lib/components/pm/TaskCard.svelte'
  import type { Task } from '$lib/data/types.js'
  import { invalidateAll } from '$app/navigation'

  let { data } = $props()

  const columns: { status: Task['status']; label: string }[] = [
    { status: 'todo', label: 'To Do' },
    { status: 'in-progress', label: 'In Progress' },
    { status: 'done', label: 'Done' },
    { status: 'blocked', label: 'Blocked' }
  ]

  let dragging = $state<string | null>(null)
  let hoveredCol = $state<string | null>(null)

  function dragstart(id: string) {
    dragging = id
  }

  function dragend() {
    dragging = null
    hoveredCol = null
  }

  async function drop(newStatus: Task['status']) {
    if (!dragging) return
    await fetch(`/api/tasks/${dragging}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    dragging = null
    await invalidateAll()
  }
</script>

<div class="p-6">
  <h1 class="text-xl font-semibold text-gray-100 mb-6">Tasks</h1>

  <div class="grid grid-cols-4 gap-4">
    {#each columns as col}
      {@const cards = data.tasks.filter((t) => t.status === col.status)}
      <KanbanColumn
        label={col.label}
        count={cards.length}
        isHovered={hoveredCol === col.status}
        ondrop={() => drop(col.status)}
        ondragenter={() => (hoveredCol = col.status)}
        ondragleave={() => (hoveredCol = null)}
      >
        {#each cards as task}
          <TaskCard
            {task}
            {dragging}
            projectNames={data.projectNames}
            ondragstart={() => dragstart(task.id)}
            ondragend={dragend}
          />
        {:else}
          <p class="text-xs text-gray-700 text-center py-4">empty</p>
        {/each}
      </KanbanColumn>
    {/each}
  </div>
</div>
