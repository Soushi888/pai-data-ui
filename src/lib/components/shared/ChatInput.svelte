<script lang="ts">
  interface Props {
    disabled: boolean
    onsubmit: (content: string) => void
  }

  let { disabled, onsubmit }: Props = $props()

  let value = $state('')
  let textarea = $state<HTMLTextAreaElement | null>(null)

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onsubmit(trimmed)
    value = ''
    setTimeout(() => textarea?.focus(), 0)
  }
</script>

<div class="border-t px-3 py-3" style="border-color: var(--athanor-border); background: var(--athanor-surface);">
  <div
    class="flex items-end gap-2 rounded-lg border px-3 py-2 transition-colors focus-within:border-[var(--athanor-gold)]"
    style="background: var(--athanor-bg); border-color: var(--athanor-border);"
  >
    <textarea
      bind:this={textarea}
      bind:value
      {disabled}
      placeholder={disabled ? 'SoushAI is responding...' : 'Ask SoushAI… (Enter to send, Shift+Enter for newline)'}
      rows="2"
      class="flex-1 resize-none bg-transparent text-xs outline-none placeholder-[var(--athanor-border)] disabled:opacity-50"
      style="color: var(--athanor-chalk);"
      onkeydown={handleKeydown}
    ></textarea>
    <button
      onclick={submit}
      {disabled}
      class="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors disabled:opacity-40"
      style="background: var(--athanor-gold); color: var(--athanor-bg);"
      title="Send (Enter)"
    >
      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
      </svg>
    </button>
  </div>
  <p class="text-[9px] mt-1 text-center" style="color: var(--athanor-border);">
    SoushAI · Read, Edit, Write · TELOS files
  </p>
</div>
