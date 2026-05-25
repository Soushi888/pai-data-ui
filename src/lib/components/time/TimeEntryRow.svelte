<script lang="ts">
  import type { TimeEntry } from '$lib/data/types.js'

  interface Props {
    entry: TimeEntry
    showTask?: boolean
    showProject?: boolean
  }

  let { entry, showTask = true, showProject = true }: Props = $props()

  const categoryColors: Record<string, string> = {
    billable: 'text-green-400 bg-green-900/30',
    'r&d': 'text-blue-400 bg-blue-900/30',
    marketing: 'text-purple-400 bg-purple-900/30',
    internal: 'text-gray-400 bg-gray-800',
    training: 'text-yellow-400 bg-yellow-900/30',
    sales: 'text-orange-400 bg-orange-900/30',
  }
</script>

<tr class="border-t border-gray-800 hover:bg-gray-900/50 transition-colors">
  <td class="py-2 px-3 text-gray-400 tabular-nums text-sm whitespace-nowrap">
    <a href="/time/{entry.id}" class="hover:text-gray-200">{entry.date}</a>
  </td>
  <td class="py-2 px-3 text-gray-300 text-sm max-w-xs">
    <a href="/time/{entry.id}" class="hover:text-white line-clamp-1" title={entry.description}>{entry.description}</a>
  </td>
  {#if showProject}
    <td class="py-2 px-3 text-gray-500 text-xs whitespace-nowrap">
      <a href="/pm" class="hover:text-gray-300">{entry.project_id.replace('proj-', '')}</a>
    </td>
  {/if}
  {#if showTask}
    <td class="py-2 px-3 text-gray-500 text-xs whitespace-nowrap">
      {#if entry.task_id}
        <a href="/pm/tasks/{entry.task_id}" class="hover:text-gray-300">{entry.task_id.replace('task-', '')}</a>
      {:else}
        <span class="text-gray-700">—</span>
      {/if}
    </td>
  {/if}
  <td class="py-2 px-3 text-right tabular-nums text-sm text-blue-400 whitespace-nowrap">
    {entry.hours_rounded}h
  </td>
  <td class="py-2 px-3">
    <span class="text-xs px-1.5 py-0.5 rounded {categoryColors[entry.category] ?? 'text-gray-400 bg-gray-800'}">
      {entry.category}
    </span>
  </td>
</tr>
