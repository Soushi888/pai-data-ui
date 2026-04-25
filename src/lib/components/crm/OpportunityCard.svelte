<script lang="ts">
  /**
   * Kanban card representing a CRM opportunity.
   * @component
   */
  import TagList from '$lib/components/shared/TagList.svelte'
  import type { Opportunity } from '$lib/data/types.js'

  interface Props {
    /** The opportunity data to display. */
    opp: Opportunity;
    /** ID of the opportunity currently being dragged, or null. */
    dragging: string | null;
    /** Handler called when drag starts on this card. */
    ondragstart: () => void;
    /** Handler called when drag ends on this card. */
    ondragend: () => void;
  }

  let {
    opp,
    dragging,
    ondragstart,
    ondragend
  }: Props = $props()

  const cad = (n?: number) =>
    n != null ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n) : null
</script>

<a
  href="/crm/opportunities/{opp.id}"
  class="block bg-gray-800 rounded p-3 mb-2 hover:bg-gray-700 transition-colors {dragging === opp.id ? 'opacity-40' : ''}"
  draggable="true"
  {ondragstart}
  {ondragend}
>
  <p class="text-sm text-gray-200 font-medium mb-1">{opp.title}</p>
  <p class="text-xs text-gray-400 mb-1">{opp.organization}</p>
  {#if opp.value_cad}
    <p class="text-xs text-green-400 mb-1">{cad(opp.value_cad)}</p>
  {/if}
  <TagList tags={opp.tags ?? []} />
</a>
