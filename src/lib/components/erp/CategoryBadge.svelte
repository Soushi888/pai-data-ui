<script lang="ts">
  interface Props {
    category: string
  }

  const colorMap: Record<string, string> = {
    housing:       'bg-blue-900/50 text-blue-300',
    utilities:     'bg-yellow-900/50 text-yellow-300',
    subscriptions: 'bg-purple-900/50 text-purple-300',
    transport:     'bg-orange-900/50 text-orange-300',
    food:          'bg-green-900/50 text-green-300',
    health:        'bg-red-900/50 text-red-300',
    other:         'bg-gray-700 text-gray-400',
  }

  let { category }: Props = $props()
  const cls = $derived(colorMap[category] ?? 'bg-gray-700 text-gray-400')
</script>

<span class="px-2 py-0.5 rounded text-xs font-medium {cls}">{category}</span>
