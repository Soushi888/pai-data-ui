<script lang="ts">
  import RawMarkdownEditor from '$lib/components/shared/RawMarkdownEditor.svelte'
  let { data } = $props()
</script>

<RawMarkdownEditor
  content={data.content}
  backUrl="/erp/invoices/{data.id}"
  title={data.id}
  saveUrl="/api/invoices/{data.id}/raw"
/>
