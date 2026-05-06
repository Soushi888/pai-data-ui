<script lang="ts">
  import SoushAISidebar from '$lib/components/shared/SoushAISidebar.svelte'
</script>

<div class="flex h-full" style="background: var(--athanor-bg);">
  <div class="flex-1 flex items-center justify-center px-8">
    <div class="text-center max-w-md">
      <div
        class="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
        style="background: color-mix(in srgb, var(--athanor-arcane) 15%, var(--athanor-surface)); border: 1px solid color-mix(in srgb, var(--athanor-arcane) 40%, transparent); box-shadow: 0 0 32px color-mix(in srgb, var(--athanor-arcane) 20%, transparent);"
      >
        <span class="text-2xl" style="color: var(--athanor-arcane);">✦</span>
      </div>
      <h1 class="text-xl font-semibold mb-2" style="color: var(--athanor-gold);">SoushAI</h1>
      <p class="text-sm" style="color: var(--athanor-mist);">
        Your Personal AI Homunculus — DataLayer-aware and at your service.
      </p>
      <p class="text-xs mt-4" style="color: var(--athanor-border);">
        Ask about your TELOS, CRM, ERP, or Projects. SoushAI can read and edit files.
      </p>
    </div>
  </div>

  <SoushAISidebar context={{ type: 'global' }} />
</div>
