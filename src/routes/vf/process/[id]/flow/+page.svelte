<script lang="ts">
  let { data } = $props()

  const ACTION_COLORS: Record<string, string> = {
    work: 'border-blue-600 bg-blue-950/40 text-blue-300',
    'deliver-service': 'border-blue-500 bg-blue-950/30 text-blue-300',
    use: 'border-amber-600 bg-amber-950/40 text-amber-300',
    consume: 'border-orange-600 bg-orange-950/40 text-orange-300',
    produce: 'border-green-600 bg-green-950/40 text-green-300',
    receive: 'border-emerald-600 bg-emerald-950/40 text-emerald-300',
    transfer: 'border-purple-600 bg-purple-950/40 text-purple-300',
    cite: 'border-gray-700 bg-gray-800/40 text-gray-400',
  }

  function actionClass(action: string) {
    return ACTION_COLORS[action] ?? 'border-gray-700 bg-gray-800/40 text-gray-400'
  }

  function shortId(id: string) {
    return id.replace(/^(task|exp|inc|proj)-/, '')
  }
</script>

<div class="p-6 max-w-3xl">
  <div class="mb-2">
    <a href="/vf" class="text-xs text-gray-500 hover:text-gray-300">← VF Dashboard</a>
  </div>

  <div class="mb-6">
    <h1 class="text-xl font-semibold text-gray-100">{data.process.title ?? data.process.id}</h1>
    <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
      {#if data.process.classified_as}
        <span class="uppercase tracking-wider">{data.process.classified_as}</span>
      {/if}
      {#if data.process.status}
        <span>{data.process.status}</span>
      {/if}
      {#if data.process.has_beginning}
        <span>started {data.process.has_beginning}</span>
      {/if}
      {#if data.totalWork > 0}
        <span class="text-blue-400 font-medium">{data.totalWork}h work total</span>
      {/if}
    </div>
  </div>

  <!-- Process flow vertical layout -->
  <div class="relative">
    <!-- Inputs -->
    {#if data.inputs.length > 0}
      <div class="mb-4">
        <p class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Inputs</p>
        <div class="space-y-2 border-l-2 border-gray-800 pl-4">
          {#each data.inputs as e}
            <div class="border rounded-lg px-3 py-2 {actionClass(e.action)}">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs opacity-80">{e.action}</span>
                  <span class="text-xs opacity-60">{shortId(e.event_id)}</span>
                </div>
                <div class="flex items-center gap-2 text-xs opacity-70">
                  {#if e.qty_value != null}
                    <span class="tabular-nums">{e.qty_value} {e.qty_unit ?? ''}</span>
                  {/if}
                  {#if e.point_in_time}
                    <span class="tabular-nums">{e.point_in_time}</span>
                  {/if}
                </div>
              </div>
              {#if e.provider}
                <div class="text-xs opacity-50 mt-0.5">{e.provider}</div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Process node -->
    <div class="flex items-center gap-3 my-4 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg">
      <div class="w-2 h-2 rounded-full bg-blue-400 shrink-0"></div>
      <span class="text-sm font-medium text-gray-200">{data.process.title ?? data.process.id}</span>
      <span class="text-xs text-gray-500 ml-auto">vf:Process</span>
    </div>

    <!-- Outputs -->
    {#if data.outputs.length > 0}
      <div class="mt-4">
        <p class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Outputs</p>
        <div class="space-y-2 border-l-2 border-gray-800 pl-4">
          {#each data.outputs as e}
            <div class="border rounded-lg px-3 py-2 {actionClass(e.action)}">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs opacity-80">{e.action}</span>
                  <span class="text-xs opacity-60">{shortId(e.event_id)}</span>
                </div>
                <div class="flex items-center gap-2 text-xs opacity-70">
                  {#if e.qty_value != null}
                    <span class="tabular-nums">{e.qty_value} {e.qty_unit ?? ''}</span>
                  {/if}
                  {#if e.point_in_time}
                    <span class="tabular-nums">{e.point_in_time}</span>
                  {/if}
                </div>
              </div>
              {#if e.receiver}
                <div class="text-xs opacity-50 mt-0.5">→ {e.receiver}</div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if data.inputs.length === 0 && data.outputs.length === 0}
      <p class="text-gray-600 text-sm mt-4">No VF events linked to this process yet. Link tasks via <code class="text-gray-500">vf_input_of: {data.process.id}</code>.</p>
    {/if}
  </div>
</div>
