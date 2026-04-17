<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import type { Task } from '$lib/data/types.js'
  import { invalidateAll } from '$app/navigation'

  let { data } = $props()

  const columns: { status: Task['status']; label: string }[] = [
    { status: 'todo', label: 'To Do' },
    { status: 'in-progress', label: 'In Progress' },
    { status: 'done', label: 'Done' },
    { status: 'blocked', label: 'Blocked' }
  ]

  const priorityDot: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-gray-500'
  }

  const systemIcon: Record<string, string> = {
    github: 'GH', gitlab: 'GL', tiki: 'TK', other: '↗'
  }

  let dragging = $state<string | null>(null)

  function dragstart(id: string) {
    dragging = id
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
      <div
        class="bg-gray-900/50 rounded-lg p-3 min-h-32"
        ondragover={(e) => e.preventDefault()}
        ondrop={() => drop(col.status)}
      >
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{col.label}</p>
          <span class="text-xs text-gray-600">{cards.length}</span>
        </div>
        {#each cards as task}
          <div
            class="bg-gray-800 rounded p-3 mb-2 cursor-pointer hover:bg-gray-700 transition-colors"
            draggable="true"
            ondragstart={() => dragstart(task.id)}
            onclick={() => window.location.href = `/pm/tasks/${task.id}`}
          >
            <div class="flex items-start gap-1.5 mb-1.5">
              <span class="w-2 h-2 rounded-full mt-1 flex-shrink-0 {priorityDot[task.priority] ?? 'bg-gray-500'}"></span>
              <p class="text-sm text-gray-200 leading-tight">{task.title}</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              {#if data.projectNames[task.project_id]}
                <span class="text-xs bg-gray-900 text-gray-500 px-1.5 rounded">{data.projectNames[task.project_id]}</span>
              {/if}
              {#if task.t_shirt_size}
                <span class="text-xs text-gray-600">{task.t_shirt_size}</span>
              {/if}
              {#if task.external_ref}
                <a href={task.external_ref.url} target="_blank" onclick={(e) => e.stopPropagation()} class="text-xs text-blue-500 font-mono hover:text-blue-400">
                  {systemIcon[task.external_ref.system]}#{task.external_ref.id}
                </a>
              {/if}
            </div>
          </div>
        {:else}
          <p class="text-xs text-gray-700 text-center py-4">empty</p>
        {/each}
      </div>
    {/each}
  </div>
</div>
