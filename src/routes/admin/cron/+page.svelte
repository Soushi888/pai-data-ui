<script lang="ts">
  let jobs = $state<HermesCronJob[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let showCreateForm = $state(false)
  let runningJobs = $state<Set<string>>(new Set())

  interface HermesCronJob {
    id: string
    name: string
    schedule: string
    status: string
    repeat: string
    nextRun: string | null
    deliver: string
    prompt: string
    script: string | null
    skills: string[]
    workdir: string | null
    noAgent: boolean
  }

  let newSchedule = $state('0 9 * * 1-5')
  let newPrompt = $state('')
  let newName = $state('')
  let newDeliver = $state('origin')
  let newScript = $state('')
  let newNoAgent = $state(false)
  let newSkills = $state('')

  async function load() {
    loading = true
    error = null
    try {
      const res = await fetch('/api/admin/cron')
      const data = await res.json()
      jobs = data.jobs ?? []
    } catch (e) {
      error = String(e)
    } finally {
      loading = false
    }
  }

  async function createJob() {
    const body: Record<string, unknown> = { schedule: newSchedule }
    if (newPrompt.trim()) body.prompt = newPrompt.trim()
    if (newName.trim()) body.name = newName.trim()
    if (newScript.trim()) body.script = newScript.trim()
    if (newNoAgent) body.noAgent = true
    if (newSkills.trim()) body.skill = newSkills.split(',').map(s => s.trim()).filter(Boolean)
    body.deliver = newDeliver

    const res = await fetch('/api/admin/cron', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json()
      error = data.error ?? 'Create failed'
      return
    }
    showCreateForm = false
    newPrompt = ''
    newName = ''
    newScript = ''
    newNoAgent = false
    newSkills = ''
    await load()
  }

  async function deleteJob(id: string) {
    const res = await fetch(`/api/admin/cron/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      error = data.error ?? 'Delete failed'
    }
    await load()
  }

  async function togglePause(id: string, currentStatus: string) {
    const action = currentStatus === 'active' ? 'pause' : 'resume'
    const res = await fetch(`/api/admin/cron/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (!res.ok) {
      const data = await res.json()
      error = data.error ?? `${action} failed`
    }
    await load()
  }

  async function runNow(id: string, name: string) {
    runningJobs.add(id); runningJobs = new Set(runningJobs)
    try {
      const res = await fetch(`/api/admin/cron/${id}`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        error = data.error ?? 'Run failed'
      }
      await load()
    } catch { error = 'Network error' }
    finally { runningJobs.delete(id); runningJobs = new Set(runningJobs) }
  }

  function humanSchedule(cron: string): string {
    const parts = cron.trim().split(/\s+/)
    if (parts.length !== 5) return cron
    const [min, hour, , , dow] = parts
    const days: Record<string, string> = { '*': 'every day', '1-5': 'weekdays', '0,6': 'weekends', '6,0': 'weekends' }
    const dayStr = days[dow] ?? dow
    if (min === '*' && hour === '*') return `every minute, ${dayStr}`
    if (min.startsWith('*/') && hour === '*') return `every ${min.slice(2)} min, ${dayStr}`
    if (min === '0' && hour === '*') return `every hour, ${dayStr}`
    if (min !== '*' && hour !== '*') {
      const timeStr = `${hour.padStart(2,'0')}:${min.padStart(2,'0')}`
      return `${dayStr} at ${timeStr}`
    }
    return cron
  }

  function formatDate(iso: string | null): string {
    if (!iso) return 'unknown'
    const d = new Date(iso)
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000)
    if (diffMin < 1) return 'now'
    if (diffMin < 60) return `in ${diffMin}m`
    if (diffMin < 1440) return `in ${Math.floor(diffMin / 60)}h`
    return d.toLocaleString()
  }

  $effect(() => { load() })
</script>

<div class="p-6 max-w-4xl">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-100">Hermes Cron Jobs</h1>
      <p class="text-xs text-gray-500 mt-0.5">Managed via <code class="text-gray-400">hermes cron</code></p>
    </div>
    <div class="flex items-center gap-2">
      <button
        onclick={() => { showCreateForm = !showCreateForm }}
        class="px-3 py-1.5 text-xs rounded border {showCreateForm ? 'border-gray-600 text-gray-400' : 'border-blue-700 text-blue-400 hover:bg-blue-900/30'} transition-colors"
      >{showCreateForm ? 'Cancel' : '+ New job'}</button>
      <button onclick={load} class="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors">Refresh</button>
    </div>
  </div>

  {#if error}
    <div class="mb-4 px-3 py-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">{error}</div>
  {/if}

  <!-- Create form -->
  {#if showCreateForm}
    <div class="mb-6 bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
      <h2 class="text-sm font-medium text-gray-300">New Cron Job</h2>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Schedule (cron)</label>
          <input bind:value={newSchedule} placeholder="0 9 * * 1-5"
            class="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-gray-200 font-mono focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Name (optional)</label>
          <input bind:value={newName} placeholder="my-cron-job"
            class="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div>
        <label class="block text-xs text-gray-500 mb-1">Prompt</label>
        <textarea bind:value={newPrompt} rows="2" placeholder="What should the agent do?"
          class="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 resize-y"></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Script path</label>
          <input bind:value={newScript} placeholder="~/.hermes/scripts/check.sh"
            class="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-gray-200 font-mono focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Skills (comma-separated)</label>
          <input bind:value={newSkills} placeholder="hermes-agent, telos"
            class="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div class="flex items-center gap-6">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Deliver to</label>
          <select bind:value={newDeliver}
            class="bg-gray-950 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500">
            <option value="origin">Origin</option>
            <option value="local">Local only</option>
            <option value="all">All channels</option>
          </select>
        </div>
        <label class="flex items-center gap-2 cursor-pointer select-none pt-4">
          <input type="checkbox" bind:checked={newNoAgent} class="w-3.5 h-3.5 accent-blue-500" />
          <span class="text-sm text-gray-300">No agent mode</span>
          <span class="text-xs text-gray-500">(script-only, raw output)</span>
        </label>
      </div>

      <div class="flex justify-end">
        <button onclick={createJob}
          class="px-4 py-1.5 text-xs rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors">Create</button>
      </div>
    </div>
  {/if}

  <!-- Job list -->
  {#if loading}
    <div class="text-gray-500 text-sm py-8 text-center">Loading...</div>
  {:else if jobs.length === 0}
    <div class="text-gray-500 text-sm py-8 text-center">
      No Hermes cron jobs. Create one with the button above or <code class="text-gray-400">hermes cron create</code>.
    </div>
  {:else}
    <div class="space-y-2">
      {#each jobs as job}
        <div class="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-medium text-gray-100">{job.name}</span>
              <span class="text-xs px-1.5 py-0.5 rounded {job.status === 'active' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}">{job.status}</span>
              {#if job.script}
                <span class="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">script</span>
              {:else}
                <span class="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">agent</span>
              {/if}
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button onclick={() => runNow(job.id, job.name)}
                disabled={runningJobs.has(job.id)}
                class="px-2.5 py-1 text-xs rounded border transition-colors {runningJobs.has(job.id) ? 'border-gray-700 text-gray-600 cursor-not-allowed' : 'border-blue-700 text-blue-400 hover:bg-blue-900/30'}">{runningJobs.has(job.id) ? '...' : 'Run'}</button>
              <button onclick={() => togglePause(job.id, job.status)}
                class="px-2.5 py-1 text-xs rounded border transition-colors {job.status === 'active' ? 'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20' : 'border-green-700 text-green-400 hover:bg-green-900/20'}">{job.status === 'active' ? 'Pause' : 'Resume'}</button>
              <button onclick={() => { if (confirm('Delete ' + job.name + '?')) deleteJob(job.id) }}
                class="px-2.5 py-1 text-xs rounded border border-red-800 text-red-400 hover:bg-red-900/20 transition-colors">Delete</button>
            </div>
          </div>

          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>schedule: <code class="text-gray-400">{job.schedule}</code> <span class="text-gray-600">- {humanSchedule(job.schedule)}</span></span>
            <span>next: <span class="text-gray-400">{formatDate(job.nextRun)}</span></span>
            <span>deliver: <span class="text-gray-400">{job.deliver}</span></span>
            <span>repeat: <span class="text-gray-400">{job.repeat}</span></span>
          </div>

          {#if job.prompt}
            <div class="mt-1 text-xs text-gray-500 truncate" title={job.prompt}>
              <span class="text-gray-600">prompt:</span> {job.prompt.slice(0, 120)}{job.prompt.length > 120 ? '...' : ''}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>