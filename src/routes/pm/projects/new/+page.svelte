<script lang="ts">
  import { goto } from '$app/navigation'
  import ChipsInput from '$lib/components/shared/ChipsInput.svelte'

  let { data } = $props()

  let title = $state(data.prefill?.title ?? '')
  let project_type = $state<'client' | 'ovn' | 'r&d'>('client')
  let status = $state<'active' | 'on-hold' | 'completed' | 'archived'>('active')
  let organization = $state(data.prefill?.organization ?? '')
  let opportunity_ref = $state(data.prefill?.opportunity_ref ?? '')
  let tags = $state<string[]>([])
  let saving = $state(false)

  async function submit(e: Event) {
    e.preventDefault()
    saving = true
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, project_type, status,
        organization: organization || undefined,
        opportunity_ref: opportunity_ref || undefined,
        tags
      })
    })
    const json = await res.json()
    if (json.project?.id) {
      if (opportunity_ref) {
        await fetch(`/api/opportunities/${opportunity_ref}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'archived' })
        })
      }
      goto(`/pm/projects/${json.project.id}`)
    }
    saving = false
  }
</script>

<div class="p-6 max-w-xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/pm/projects" class="text-gray-500 hover:text-gray-300 text-sm">← Projects</a>
    <h1 class="text-xl font-semibold text-gray-100">New Project</h1>
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form onsubmit={submit} onkeydown={(e) => { if (e.ctrlKey && e.key === 'Enter') e.currentTarget.requestSubmit() }} class="space-y-4">
    <div>
      <label class="text-xs text-gray-500 block mb-1">Title *</label>
      <input bind:value={title} required class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs text-gray-500 block mb-1">Type *</label>
        <select bind:value={project_type} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full">
          <option value="client">client</option>
          <option value="ovn">ovn</option>
          <option value="r&d">r&d</option>
        </select>
      </div>
      <div>
        <label class="text-xs text-gray-500 block mb-1">Status</label>
        <select bind:value={status} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full">
          <option value="active">active</option>
          <option value="on-hold">on-hold</option>
        </select>
      </div>
    </div>
    <div>
      <label class="text-xs text-gray-500 block mb-1">Organization</label>
      <input bind:value={organization} class="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full" />
    </div>
    {#if opportunity_ref}
      <div>
        <label class="text-xs text-gray-500 block mb-1">Opportunity Ref</label>
        <input bind:value={opportunity_ref} class="bg-gray-800 border border-gray-700 text-gray-400 rounded px-3 py-2 text-sm w-full" readonly />
      </div>
    {/if}
    <div>
      <label class="text-xs text-gray-500 block mb-1">Tags</label>
      <ChipsInput bind:tags />
    </div>
    <button type="submit" disabled={saving || !title} class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
      {saving ? 'Creating…' : 'Create Project'}
    </button>
  </form>
</div>
