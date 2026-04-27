<script lang="ts">
  import { page } from '$app/state'

  const is404 = $derived(page.status === 404)
  const label = $derived(is404 ? 'Page not found' : 'Something went wrong')
  const hasMessage = $derived(
    !is404 && !!page.error?.message && page.error.message !== 'Internal Error'
  )
</script>

<div class="error-bg flex items-center justify-center min-h-full py-20 px-6">
  <div class="w-full max-w-sm text-center">

    <div class="relative mb-2">
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="w-56 h-32 bg-blue-600/8 rounded-full blur-3xl"></div>
      </div>

      <div class="flex justify-center mb-5 relative">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden="true">
          <circle cx="30" cy="30" r="26" stroke="#1e40af" stroke-width="1" stroke-dasharray="4 3" opacity="0.35"/>
          <circle cx="30" cy="30" r="17" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.5"/>
          <circle cx="30" cy="30" r="5" fill="#3b82f6" opacity="0.9"/>
          <circle cx="44" cy="15" r="3.5" fill="none" stroke="#60a5fa" stroke-width="1.5" opacity="0.6"/>
          <circle cx="15" cy="44" r="3.5" fill="none" stroke="#60a5fa" stroke-width="1.5" opacity="0.45"/>
          <circle cx="46" cy="40" r="2.5" fill="none" stroke="#3b82f6" stroke-width="1.5" opacity="0.35"/>
          <line x1="34" y1="26" x2="41" y2="19" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.45"/>
          <line x1="26" y1="34" x2="19" y2="41" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.3"/>
          <line x1="34" y1="33" x2="43" y2="38" stroke="#3b82f6" stroke-width="1" stroke-dasharray="2 2" opacity="0.2"/>
          <text x="30" y="34" text-anchor="middle" fill="#93c5fd" font-size="9" font-weight="700" font-family="monospace" opacity="0.85">?</text>
        </svg>
      </div>

      <div class="status-number text-[8rem] font-black leading-none tracking-tighter select-none relative">
        {page.status}
      </div>
    </div>

    <h1 class="text-xl font-semibold text-gray-200 mt-3 mb-2">{label}</h1>

    {#if hasMessage}
      <p class="text-gray-500 text-xs font-mono bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 inline-block max-w-full break-words">
        {page.error?.message}
      </p>
    {/if}

    <div class="border-t border-gray-800/60 my-7"></div>

    <div class="flex gap-3 justify-center">
      <button
        onclick={() => history.back()}
        class="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium border border-gray-700 transition-colors cursor-pointer"
      >
        ← Go back
      </button>
      <a
        href="/"
        class="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
      >
        Dashboard
      </a>
    </div>

  </div>
</div>

<style>
  .error-bg {
    background-image: radial-gradient(circle, rgba(55, 65, 81, 0.35) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  .status-number {
    background: linear-gradient(to bottom, var(--color-blue-400, #60a5fa), var(--color-blue-700, #1d4ed8));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
</style>
