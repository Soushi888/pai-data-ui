<script lang="ts">
  import type { Task } from '$lib/data/types.js'

  let {
    task,
    dragging,
    projectNames,
    ondragstart,
    ondragend
  }: {
    task: Task
    dragging: string | null
    projectNames: Record<string, string>
    ondragstart: () => void
    ondragend: () => void
  } = $props()

  const priorityDot: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-gray-500'
  }

  const systemIcon: Record<string, string> = {
    github: 'GH', gitlab: 'GL', tiki: 'TK', other: '↗'
  }
</script>

<div
  class="bg-gray-800 rounded p-3 mb-2 cursor-pointer hover:bg-gray-700 transition-colors {dragging === task.id ? 'opacity-40' : ''}"
  draggable="true"
  {ondragstart}
  {ondragend}
  onclick={() => window.location.href = `/pm/tasks/${task.id}`}
>
  <div class="flex items-start gap-1.5 mb-1.5">
    <span class="w-2 h-2 rounded-full mt-1 flex-shrink-0 {priorityDot[task.priority] ?? 'bg-gray-500'}"></span>
    <p class="text-sm text-gray-200 leading-tight">{task.title}</p>
  </div>
  <div class="flex items-center gap-2 flex-wrap">
    {#if projectNames[task.project_id]}
      <span class="text-xs bg-gray-900 text-gray-500 px-1.5 rounded">{projectNames[task.project_id]}</span>
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
