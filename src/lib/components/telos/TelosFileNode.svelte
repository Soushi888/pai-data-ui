<script lang="ts">
  interface Props {
    file: string
    active: boolean
    exists: boolean
  }

  let { file, active, exists }: Props = $props()

  const label = file.includes('/') ? file.split('/').pop()! : file.replace('.md', '')
  const href = `/telos/${encodeURIComponent(file.replace('.md', ''))}`
</script>

<a
  {href}
  class="block px-2 py-1 rounded text-xs font-mono transition-colors truncate
    {active
      ? 'text-[var(--athanor-gold)] bg-[var(--athanor-surface)] border-l-2 border-[var(--athanor-gold)]'
      : exists
        ? 'text-[var(--athanor-mist)] hover:text-[var(--athanor-chalk)] hover:bg-[var(--athanor-surface)]'
        : 'text-[var(--athanor-border)] cursor-default pointer-events-none'}"
  title={file}
>
  {label}
</a>
