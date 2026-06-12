/**
 * Shared drag state for cross-panel focus drag-and-drop.
 *
 * Each {@link FocusListPanel} instance owns its own local within-panel reorder
 * state, but a drag that crosses panel boundaries needs a payload that is
 * visible to both the source and destination panel. This module-level rune
 * store carries the dragged item and its source list id across those
 * independent component instances.
 */
import type { FocusItem } from '$lib/data/types.js'

class FocusDragState {
  /** The item currently being dragged, or null when no drag is active. */
  item = $state<FocusItem | null>(null)
  /** The list id the dragged item originates from, or null. */
  sourceListId = $state<string | null>(null)

  /** Begin a cross-panel-capable drag of `item` from `listId`. */
  start(item: FocusItem, listId: string) {
    this.item = item
    this.sourceListId = listId
  }

  /** Clear the shared drag payload. */
  clear() {
    this.item = null
    this.sourceListId = null
  }
}

/** Singleton shared across all FocusListPanel instances on the page. */
export const focusDrag = new FocusDragState()
