<script lang="ts">
  let { data } = $props()
</script>

<!-- redirected server-side; fallback if no files exist -->
<div class="flex-1 flex items-center justify-center" style="color: var(--athanor-mist);">
  <p class="text-sm">No TELOS files found at TELOS_ROOT.</p>
</div>
