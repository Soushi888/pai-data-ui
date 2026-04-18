<script lang="ts">
  let { tags = $bindable([]) }: { tags: string[] } = $props()

  let inputValue = $state('')
  let inputEl: HTMLInputElement

  function addTag() {
    const tag = inputValue.trim()
    if (tag && !tags.includes(tag)) {
      tags = [...tags, tag]
    }
    inputValue = ''
  }

  function removeTag(tag: string) {
    tags = tags.filter((t) => t !== tag)
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    } else if (e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      tags = tags.slice(0, -1)
    }
  }
</script>

<div
  class="flex flex-wrap gap-1 items-center bg-gray-800 border border-gray-700 rounded px-2 py-1.5 min-h-[38px] focus-within:border-blue-500 cursor-text"
  onclick={() => inputEl?.focus()}
  role="group"
>
  {#each tags as tag}
    <span class="flex items-center gap-1 px-1.5 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
      {tag}
      <button
        type="button"
        onclick={() => removeTag(tag)}
        class="text-gray-500 hover:text-gray-200 leading-none"
        aria-label="Remove {tag}"
      >×</button>
    </span>
  {/each}
  <input
    bind:this={inputEl}
    bind:value={inputValue}
    onkeydown={onKeydown}
    placeholder={tags.length === 0 ? 'Add tags…' : ''}
    class="bg-transparent text-gray-200 text-sm outline-none flex-1 min-w-20 placeholder-gray-600"
  />
</div>
