<script lang="ts">
  import RawMarkdownEditor from '$lib/components/shared/RawMarkdownEditor.svelte'
  let { data } = $props()
</script>

<RawMarkdownEditor
  content={data.content}
  backUrl="/crm/opportunities/{data.id}"
  title={data.id}
  saveUrl="/api/opportunities/{data.id}/raw"
/>
