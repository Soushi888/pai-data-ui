<script lang="ts">
  import TelosNavigator from '$lib/components/telos/TelosNavigator.svelte'
  import TelosViewer from '$lib/components/telos/TelosViewer.svelte'
  import SoushAISidebar from '$lib/components/shared/SoushAISidebar.svelte'
  import type { Change } from 'diff'

  let { data } = $props()

  let currentDiff = $state<Change[] | null>(null)
  let diffStreaming = $state(false)

  function handleFileEdit(diff: Change[]) {
    currentDiff = diff
    diffStreaming = false
  }

  function handleDiffDismiss() {
    currentDiff = null
  }
</script>

<TelosNavigator files={data.files} currentFile={data.file} />

<TelosViewer
  file={data.file}
  content={data.content}
  diff={currentDiff}
  streaming={diffStreaming}
  ondiffDismiss={handleDiffDismiss}
/>

<SoushAISidebar
  context={{ type: 'telos', file: data.file, content: data.content }}
  onFileEdit={handleFileEdit}
/>
