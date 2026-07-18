<script lang="ts">
  let { data } = $props()
  type Job = (typeof data.jobs)[number]

  let jobs = $state(data.jobs)
  let runningJobs = $state<Set<string>>(new Set())
  let editingJob = $state<string | null>(null)
  let lastError = $state<string | null>(null)

  // ── Edit state ──
  let editSchedule = $state('')
  let editPrompt = $state('')
  let editCommand = $state('')
  let editOutputVoice = $state(false)
  let editOutputLog = $state(false)

  // Schedule builder
  let scheduleMode = $state<'preset' | 'custom'>('preset')
  let scheduleHour = $state('8')
  let scheduleMinute = $state('0')
  let scheduleDays = $state<number[]>([1, 2, 3, 4, 5]) // 0=Sun … 6=Sat

  const PRESETS = [
    { label: 'Every minute',  cron: '* * * * *' },
    { label: 'Every 5 min',   cron: '*/5 * * * *' },
    { label: 'Every 15 min',  cron: '*/15 * * * *' },
    { label: 'Every hour',    cron: '0 * * * *' },
    { label: 'Daily',         cron: '__time__ * * *' },
    { label: 'Weekdays',      cron: '__time__ * * 1-5' },
    { label: 'Custom',        cron: '' },
  ]
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  let selectedPreset = $state<string | null>(null)

  function buildCronFromPicker(): string {
    const min = scheduleMinute.padStart(2, '0')
    const hour = scheduleHour.padStart(2, '0')
    if (scheduleDays.length === 7 || scheduleDays.length === 0) return `${min} ${hour} * * *`
    const sorted = [...scheduleDays].sort((a, b) => a - b)
    // Check for contiguous range
    const isRange = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1)
    const dowStr = isRange && sorted.length > 2
      ? `${sorted[0]}-${sorted[sorted.length - 1]}`
      : sorted.join(',')
    return `${min} ${hour} * * ${dowStr}`
  }

  function resolvePresetCron(cron: string): string {
    if (!cron.includes('__time__')) return cron
    const min = scheduleMinute.padStart(2, '0')
    const hour = scheduleHour.padStart(2, '0')
    return cron.replace('__time__', `${min} ${hour}`)
  }

  let computedCron = $derived(
    selectedPreset === 'Custom' ? editSchedule
    : selectedPreset
      ? resolvePresetCron(PRESETS.find(p => p.label === selectedPreset)!.cron)
      : buildCronFromPicker()
  )

  function parseCronToBuilder(cron: string) {
    // Try to match a preset first
    const normCron = cron.trim()
    for (const p of PRESETS) {
      if (!p.cron || p.label === 'Custom') continue
      if (!p.cron.includes('__time__') && p.cron === normCron) {
        selectedPreset = p.label; return
      }
    }
    // Parse min/hour/dow fields
    const parts = normCron.split(/\s+/)
    if (parts.length === 5) {
      const [min, hour, , , dow] = parts
      if (min !== '*') scheduleMinute = min.replace(/^0/, '') || '0'
      if (hour !== '*') scheduleHour = hour.replace(/^0/, '') || '0'
      // Parse days
      if (dow === '*') {
        scheduleDays = [0, 1, 2, 3, 4, 5, 6]
      } else if (dow.includes('-')) {
        const [s, e] = dow.split('-').map(Number)
        scheduleDays = Array.from({ length: e - s + 1 }, (_, i) => s + i)
      } else {
        scheduleDays = dow.split(',').map(Number)
      }
      // Match to daily/weekdays presets
      if (dow === '*') selectedPreset = 'Daily'
      else if (dow === '1-5') selectedPreset = 'Weekdays'
      else selectedPreset = 'Custom'
    } else {
      selectedPreset = 'Custom'
    }
    editSchedule = cron
  }

  function toggleDay(d: number) {
    scheduleDays = scheduleDays.includes(d)
      ? scheduleDays.filter(x => x !== d)
      : [...scheduleDays, d].sort((a, b) => a - b)
    if (selectedPreset !== 'Custom' && selectedPreset !== 'Daily' && selectedPreset !== 'Weekdays') {
      selectedPreset = 'Weekdays'
    }
  }

  function humanCron(cron: string): string {
    const parts = cron.trim().split(/\s+/)
    if (parts.length !== 5) return cron
    const [min, hour, , , dow] = parts
    const timeStr = (min === '*' || hour === '*')
      ? null
      : `${hour.padStart(2,'0')}:${min.padStart(2,'0')}`
    const dayStr = dow === '*' ? 'every day'
      : dow === '1-5' ? 'weekdays'
      : dow === '0,6' || dow === '6,0' ? 'weekends'
      : dow.includes('-')
        ? (() => { const [s,e]=dow.split('-').map(Number); return DAY_LABELS.slice(s,e+1).join('/') })()
        : dow.split(',').map(d => DAY_LABELS[+d]).join('/')
    if (min === '*' && hour === '*') return `every minute, ${dayStr}`
    if (min.startsWith('*/') && hour === '*') return `every ${min.slice(2)} min, ${dayStr}`
    if (min === '0' && hour === '*') return `every hour, ${dayStr}`
    if (timeStr) return `${dayStr} at ${timeStr}`
    return cron
  }

  function startEdit(job: Job) {
    editingJob = job.name
    editPrompt = job.prompt ?? ''
    editCommand = job.command ?? ''
    const out = Array.isArray(job.output) ? job.output : [job.output]
    editOutputVoice = out.includes('voice')
    editOutputLog = out.includes('log')
    scheduleHour = '8'
    scheduleMinute = '0'
    scheduleDays = [1,2,3,4,5]
    selectedPreset = null
    parseCronToBuilder(job.schedule)
  }

  function cancelEdit() { editingJob = null }

  async function saveEdit(job: Job) {
    const outputs: string[] = []
    if (editOutputVoice) outputs.push('voice')
    if (editOutputLog) outputs.push('log')
    const body: Record<string, unknown> = {
      schedule: computedCron,
      output: outputs.length === 1 ? outputs[0] : outputs,
    }
    if (job.type === 'hermes') body.prompt = editPrompt.trim()
    if (job.type === 'script') body.command = editCommand.trim()

    const res = await fetch(`/api/jobs/${job.name}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) { editingJob = null; await refresh() }
    else lastError = `Failed to save ${job.name}`
  }

  async function refresh() {
    const res = await fetch('/api/jobs')
    if (res.ok) jobs = (await res.json()).jobs
  }

  async function runNow(job: Job) {
    runningJobs.add(job.name); runningJobs = new Set(runningJobs); lastError = null
    try {
      const res = await fetch(`/api/jobs/${job.name}?action=run`, { method: 'POST' })
      if (!res.ok) lastError = `Failed to run ${job.name}`
      await refresh()
    } catch { lastError = `Network error` }
    finally { runningJobs.delete(job.name); runningJobs = new Set(runningJobs) }
  }

  async function toggle(job: Job) {
    const res = await fetch(`/api/jobs/${job.name}?action=toggle`, { method: 'POST' })
    if (res.ok) await refresh()
  }

  function formatDate(iso: string | null): string {
    if (!iso) return 'never'
    const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`
    return new Date(iso).toLocaleDateString()
  }
</script>

<div class="p-6 max-w-4xl">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-100">Cron Jobs</h1>
      <p class="text-xs text-gray-500 mt-0.5">Configured in <code class="text-gray-400">~/.hermes/USER/DATA/jobs.toml</code></p>
    </div>
    <button onclick={refresh} class="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors">Refresh</button>
  </div>

  {#if lastError}
    <div class="mb-4 px-3 py-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">{lastError}</div>
  {/if}

  <div class="space-y-3">
    {#each jobs as job}
      {@const s = job.state}
      {@const isEditing = editingJob === job.name}
      <div class="bg-gray-900 border {isEditing ? 'border-blue-700/60' : 'border-gray-800'} rounded-lg overflow-hidden transition-colors">

        <!-- Header row -->
        <div class="flex items-center justify-between gap-4 px-4 py-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium text-gray-100">{job.name}</span>
            <span class="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">{job.type}</span>
            {#if s.running}
              <span class="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 animate-pulse">running</span>
            {:else if s.lastResult === 'ok'}
              <span class="text-xs text-green-500">✓</span>
            {:else if s.lastResult === 'error'}
              <span class="text-xs text-red-400">✗ error</span>
            {/if}
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            {#if !isEditing}
              <button onclick={() => startEdit(job)} class="px-2.5 py-1 text-xs rounded border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors">Edit</button>
              <button
                onclick={() => runNow(job)}
                disabled={runningJobs.has(job.name) || s.running}
                class="px-2.5 py-1 text-xs rounded border transition-colors {runningJobs.has(job.name)||s.running ? 'border-gray-700 text-gray-600 cursor-not-allowed' : 'border-blue-700 text-blue-400 hover:bg-blue-900/30'}"
              >{runningJobs.has(job.name) ? '…' : 'Run now'}</button>
              <button
                onclick={() => toggle(job)}
                class="px-2.5 py-1 text-xs rounded border transition-colors {job.enabled ? 'border-green-800 text-green-400 hover:bg-red-900/20 hover:border-red-700 hover:text-red-400' : 'border-gray-700 text-gray-500 hover:bg-green-900/20 hover:border-green-700 hover:text-green-400'}"
              >{job.enabled ? 'Enabled' : 'Disabled'}</button>
            {:else}
              <button onclick={cancelEdit} class="px-2.5 py-1 text-xs rounded border border-gray-700 text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
              <button onclick={() => saveEdit(job)} class="px-2.5 py-1 text-xs rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors">Save</button>
            {/if}
          </div>
        </div>

        <!-- Summary row (collapsed) -->
        {#if !isEditing}
          <div class="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 border-t border-gray-800/60 pt-2">
            <span>schedule: <code class="text-gray-400">{job.schedule}</code> <span class="text-gray-600">— {humanCron(job.schedule)}</span></span>
            <span>output: <span class="text-gray-400">{Array.isArray(job.output) ? job.output.join(', ') : job.output}</span></span>
            <span>last run: <span class="text-gray-400">{formatDate(s.lastRun)}</span></span>
            {#if s.consecutiveFailures > 0}<span class="text-red-400">{s.consecutiveFailures} failure(s)</span>{/if}
          </div>
          {#if s.lastOutput}
            <pre class="mx-4 mb-3 text-xs text-gray-400 bg-gray-950 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-24 overflow-y-auto">{s.lastOutput}</pre>
          {/if}

        <!-- Edit form (expanded) -->
        {:else}
          <div class="px-4 pb-4 border-t border-gray-800/60 pt-4 space-y-5">

            <!-- Schedule builder -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-2">Schedule</label>

              <!-- Presets -->
              <div class="flex flex-wrap gap-1.5 mb-3">
                {#each PRESETS as preset}
                  <button
                    onclick={() => { selectedPreset = preset.label; if (preset.label === 'Custom') editSchedule = computedCron }}
                    class="px-2.5 py-1 text-xs rounded-full border transition-colors {selectedPreset === preset.label ? 'border-blue-600 bg-blue-900/40 text-blue-300' : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'}"
                  >{preset.label}</button>
                {/each}
              </div>

              <!-- Time picker — show when preset needs a time -->
              {#if selectedPreset === 'Daily' || selectedPreset === 'Weekdays' || selectedPreset === null}
                <div class="flex items-center gap-3 mb-3">
                  <span class="text-xs text-gray-500 w-10">Time</span>
                  <div class="flex items-center gap-1">
                    <input
                      type="number" min="0" max="23"
                      bind:value={scheduleHour}
                      class="w-14 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 text-center focus:outline-none focus:border-blue-500"
                      placeholder="HH"
                    />
                    <span class="text-gray-500 font-bold">:</span>
                    <input
                      type="number" min="0" max="59"
                      bind:value={scheduleMinute}
                      class="w-14 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 text-center focus:outline-none focus:border-blue-500"
                      placeholder="MM"
                    />
                  </div>
                </div>
              {/if}

              <!-- Day picker — show for Weekdays or null (custom day selection) -->
              {#if selectedPreset === 'Weekdays' || selectedPreset === null}
                <div class="flex items-center gap-3 mb-3">
                  <span class="text-xs text-gray-500 w-10">Days</span>
                  <div class="flex gap-1">
                    {#each DAY_LABELS as day, i}
                      <button
                        onclick={() => toggleDay(i)}
                        class="w-9 py-1 text-xs rounded border transition-colors {scheduleDays.includes(i) ? 'border-blue-600 bg-blue-900/40 text-blue-300' : 'border-gray-700 text-gray-500 hover:border-gray-500'}"
                      >{day}</button>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Custom raw input -->
              {#if selectedPreset === 'Custom'}
                <div class="flex items-center gap-3 mb-3">
                  <span class="text-xs text-gray-500 w-10">Cron</span>
                  <input
                    bind:value={editSchedule}
                    placeholder="* * * * *"
                    class="flex-1 bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-gray-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              {/if}

              <!-- Live preview -->
              <div class="flex items-center gap-2 text-xs">
                <code class="text-gray-500 bg-gray-950 px-2 py-0.5 rounded">{computedCron}</code>
                <span class="text-gray-600">→</span>
                <span class="text-gray-400">{humanCron(computedCron)}</span>
              </div>
            </div>

            <!-- Prompt / Command -->
            {#if job.type === 'hermes'}
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5">Prompt</label>
                <textarea
                  bind:value={editPrompt}
                  rows="3"
                  class="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 resize-y"
                ></textarea>
              </div>
            {:else}
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5">Command</label>
                <input
                  bind:value={editCommand}
                  class="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-gray-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            {/if}

            <!-- Output checkboxes -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-2">Output</label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" bind:checked={editOutputVoice} class="w-3.5 h-3.5 accent-blue-500" />
                  <span class="text-sm text-gray-300">Voice</span>
                  <span class="text-xs text-gray-500">(speaks the result)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" bind:checked={editOutputLog} class="w-3.5 h-3.5 accent-blue-500" />
                  <span class="text-sm text-gray-300">Log</span>
                  <span class="text-xs text-gray-500">(writes to cron.log)</span>
                </label>
              </div>
            </div>

          </div>
        {/if}

      </div>
    {/each}
  </div>
</div>
