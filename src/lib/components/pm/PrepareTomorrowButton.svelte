<script lang="ts">
  import { invalidateAll } from '$app/navigation'

  export type Props = {
    tomorrowExists: boolean;
    tomorrowId: string | null;
    tomorrowDate: string;
  }

  let { tomorrowExists, tomorrowId, tomorrowDate }: Props = $props()

  let creating = $state(false)

  async function createTomorrow() {
    creating = true
    await fetch('/api/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'focus-daily', date: tomorrowDate }),
    })
    await invalidateAll()
    creating = false
  }
</script>

{#if tomorrowExists && tomorrowId}
  <a
    href="/pm/focus/{tomorrowId}"
    class="rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-600"
  >
    See tomorrow →
  </a>
{:else}
  <button
    class="rounded bg-blue-600/80 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
    onclick={createTomorrow}
    disabled={creating}
  >
    {creating ? 'Creating...' : 'Prepare tomorrow'}
  </button>
{/if}
