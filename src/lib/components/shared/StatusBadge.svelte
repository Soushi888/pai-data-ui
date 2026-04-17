<script lang="ts">
  const colorMap: Record<string, string> = {
    active: 'text-green-300 bg-green-900/50',
    inactive: 'text-gray-400 bg-gray-800',
    prospect: 'text-yellow-300 bg-yellow-900/50',
    won: 'text-green-300 bg-green-900/50',
    lost: 'text-red-300 bg-red-900/50',
    'on-hold': 'text-yellow-300 bg-yellow-900/50',
    draft: 'text-gray-400 bg-gray-800',
    sent: 'text-blue-300 bg-blue-900/50',
    paid: 'text-green-300 bg-green-900/50',
    overdue: 'text-red-300 bg-red-900/50',
    cancelled: 'text-gray-500 bg-gray-800',
    todo: 'text-gray-400 bg-gray-800',
    'in-progress': 'text-blue-300 bg-blue-900/50',
    done: 'text-green-300 bg-green-900/50',
    blocked: 'text-red-300 bg-red-900/50',
    client: 'text-blue-300 bg-blue-900/50',
    ovn: 'text-purple-300 bg-purple-900/50',
    'r&d': 'text-yellow-300 bg-yellow-900/50',
    completed: 'text-green-300 bg-green-900/50',
    archived: 'text-gray-500 bg-gray-800',
  }

  let { status }: { status: string } = $props()
  const cls = $derived(colorMap[status] ?? 'text-gray-400 bg-gray-800')
</script>

<span class="px-2 py-0.5 rounded text-xs font-medium {cls}">{status}</span>
