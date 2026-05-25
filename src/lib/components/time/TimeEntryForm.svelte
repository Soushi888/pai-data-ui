<script lang="ts">
  interface Props {
    taskId?: string
    projectId?: string
    onSuccess?: (entry: unknown) => void
  }

  let { taskId, projectId, onSuccess }: Props = $props()

  let date = $state(new Date().toISOString().split('T')[0])
  let durationInput = $state('')
  let description = $state('')
  let category = $state<'billable' | 'r&d' | 'marketing' | 'internal' | 'training' | 'sales'>('billable')
  let submitting = $state(false)
  let error = $state('')
  let success = $state(false)

  function parseDuration(input: string): number | null {
    const s = input.trim().toLowerCase()
    const hMatch = s.match(/^(\d+\.?\d*)h$/)
    if (hMatch) return Math.round(Number(hMatch[1]) * 60)
    const mMatch = s.match(/^(\d+)m$/)
    if (mMatch) return Number(mMatch[1])
    const plain = s.match(/^(\d+)$/)
    if (plain) return Number(plain[1])
    const decH = s.match(/^(\d+\.?\d*)$/)
    if (decH) return Math.round(Number(decH[1]) * 60)
    return null
  }

  async function submit(e: Event) {
    e.preventDefault()
    error = ''
    const minutes = parseDuration(durationInput)
    if (!minutes || minutes <= 0) { error = 'Invalid duration. Use: 2h, 90m, 120, or 1.5'; return }
    if (!description.trim()) { error = 'Description required'; return }
    if (!projectId && !taskId) { error = 'No project or task context'; return }

    submitting = true
    const hours_rounded = Math.round((minutes / 60) * 4) / 4
    const body: Record<string, unknown> = {
      date, minutes, hours_rounded, description: description.trim(),
      category, tags: ['evoludata'],
      project_id: projectId ?? '',
    }
    if (taskId) body.task_id = taskId

    const res = await fetch('/api/time-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    submitting = false
    if (!res.ok) { error = 'Failed to create entry'; return }
    const data = await res.json()
    success = true
    description = ''
    durationInput = ''
    setTimeout(() => (success = false), 3000)
    onSuccess?.(data.entry)
  }
</script>

<form onsubmit={submit} class="flex flex-col gap-3 p-4 bg-gray-900 rounded border border-gray-800">
  <div class="flex gap-3 flex-wrap">
    <div>
      <label class="text-xs text-gray-500 block mb-1">Date</label>
      <input type="date" bind:value={date} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
    </div>
    <div>
      <label class="text-xs text-gray-500 block mb-1">Duration</label>
      <input bind:value={durationInput} placeholder="2h or 90m or 120" class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-36" />
    </div>
    <div>
      <label class="text-xs text-gray-500 block mb-1">Category</label>
      <select bind:value={category} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
        <option value="billable">billable</option>
        <option value="r&d">r&d</option>
        <option value="marketing">marketing</option>
        <option value="internal">internal</option>
        <option value="training">training</option>
        <option value="sales">sales</option>
      </select>
    </div>
  </div>
  <div>
    <label class="text-xs text-gray-500 block mb-1">Description</label>
    <input bind:value={description} placeholder="What did you work on?" class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
  </div>
  {#if error}
    <p class="text-red-400 text-xs">{error}</p>
  {/if}
  <div class="flex items-center gap-3">
    <button type="submit" disabled={submitting} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
      {submitting ? 'Saving…' : '+ Log Time'}
    </button>
    {#if success}
      <span class="text-green-400 text-xs">Logged!</span>
    {/if}
  </div>
</form>
