<script lang="ts">
  import { enhance } from '$app/forms'

  let {
    content,
    backUrl,
    title
  }: { content: string; backUrl: string; title: string } = $props()

  let value = $state(content)
  let dirty = $state(false)
  let saving = $state(false)
  let saved = $state(false)

  $effect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  })
</script>

<div class="flex flex-col h-full p-6 max-w-5xl">
  <div class="flex items-center gap-3 mb-4">
    <a href={backUrl} class="text-gray-500 hover:text-gray-300 text-sm">← Back</a>
    <h1 class="text-sm font-semibold text-gray-400">{title} — Raw Markdown</h1>
    {#if dirty}
      <span class="text-xs text-amber-500">unsaved changes</span>
    {/if}
    {#if saved}
      <span class="text-xs text-green-400">Saved ✓</span>
    {/if}
    <div class="ml-auto">
      <form
        method="POST"
        action="?/save"
        use:enhance={() => {
          saving = true
          return async ({ update }) => {
            await update()
            saving = false
            saved = true
            dirty = false
            setTimeout(() => (saved = false), 2000)
          }
        }}
      >
        <input type="hidden" name="content" bind:value />
        <button
          type="submit"
          disabled={saving || !dirty}
          class="text-xs px-3 py-1.5 rounded transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  </div>

  <textarea
    bind:value
    oninput={() => (dirty = true)}
    spellcheck="false"
    class="flex-1 font-mono text-sm bg-gray-950 text-gray-200 border border-gray-700 rounded p-4 resize-none focus:outline-none focus:border-blue-500 min-h-[70vh]"
  ></textarea>
</div>
