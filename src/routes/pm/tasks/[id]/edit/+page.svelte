<script lang="ts">
  import RawMarkdownEditor from '$lib/components/shared/RawMarkdownEditor.svelte'
  let { data } = $props()
</script>

<RawMarkdownEditor
  content={data.content}
  backUrl="/pm/tasks/{data.id}"
  title={data.id}
  saveUrl="/api/tasks/{data.id}/raw"
/>
