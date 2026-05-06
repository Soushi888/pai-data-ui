<script lang="ts">
  let { children } = $props()
</script>

<div class="flex h-full overflow-hidden" style="background: var(--athanor-bg);">
  {@render children()}
</div>
