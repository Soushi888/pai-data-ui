<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'

  let { data } = $props()

  type FilterTab = 'active' | 'all' | 'archived'
  let activeTab = $state<FilterTab>('active')

  const visibleProjects = $derived(
    activeTab === 'all'
      ? data.projects
      : activeTab === 'archived'
        ? data.projects.filter((p) => p.status === 'archived')
        : data.projects.filter((p) => p.status !== 'archived')
  )

  const priorityDot: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-gray-500'
  }

  const systemIcon: Record<string, string> = {
    github: 'GH',
    gitlab: 'GL',
    tiki: 'TK',
    other: '↗'
  }
</script>

<div class="p-6 max-w-4xl">
  <h1 class="text-xl font-semibold text-gray-100 mb-4">Projects</h1>

  <div class="flex gap-1 mb-6">
    {#each (['active', 'all', 'archived'] as const) as tab}
      <button
        onclick={() => (activeTab = tab)}
        class="px-3 py-1 text-xs rounded transition-colors
          {activeTab === tab
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}"
      >
        {tab === 'active' ? 'Active' : tab === 'all' ? 'All' : 'Archived'}
      </button>
    {/each}
  </div>

  {#if visibleProjects.length === 0}
    <p class="text-gray-500 text-sm">No {activeTab === 'archived' ? 'archived' : activeTab === 'all' ? '' : 'active'} projects. {#if activeTab === 'active'}<a href="/pm/projects/new" class="text-blue-400 hover:text-blue-300">Create one</a>.{/if}</p>
  {/if}

  {#each visibleProjects as project}
    {@const tasks = data.tasksByProject[project.id] ?? []}
    {@const inProgress = tasks.filter((t) => t.status === 'in-progress')}
    {@const todo = tasks.filter((t) => t.status === 'todo')}
    {@const hours = data.hoursThisWeek[project.id] ?? 0}

    <div class="mb-6 bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <a href="/pm/projects/{project.id}" class="text-gray-200 font-medium hover:text-blue-300">
          {project.title}
        </a>
        <div class="flex items-center gap-2">
          <StatusBadge status={project.status} />
          <StatusBadge status={project.project_type} />
          {#if hours > 0}
            <span class="text-xs text-gray-500">{hours}h this week</span>
          {/if}
        </div>
      </div>

      {#if inProgress.length === 0 && todo.length === 0}
        <p class="px-4 py-3 text-xs text-gray-600">No active tasks</p>
      {/if}

      {#each [...inProgress, ...todo.slice(0, 3)] as task}
        <a href="/pm/tasks/{task.id}" class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 border-t border-gray-800/50 transition-colors">
          <span class="w-2 h-2 rounded-full flex-shrink-0 {priorityDot[task.priority] ?? 'bg-gray-500'}"></span>
          <span class="text-xs {task.status === 'in-progress' ? 'text-blue-300' : task.status === 'blocked' ? 'text-red-400' : 'text-gray-400'} w-20 flex-shrink-0">
            [{task.status}]
          </span>
          <span class="text-sm text-gray-300 flex-1">{task.title}</span>
          {#if task.t_shirt_size}
            <span class="text-xs text-gray-600 bg-gray-800 px-1.5 rounded">{task.t_shirt_size}</span>
          {/if}
          {#if task.external_ref}
            <span class="text-xs text-blue-500 font-mono">
              {systemIcon[task.external_ref.system] ?? '↗'}#{task.external_ref.id}
            </span>
          {/if}
        </a>
      {/each}
    </div>
  {/each}

  <a href="/pm/projects/new" class="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors">
    + New Project
  </a>
</div>
