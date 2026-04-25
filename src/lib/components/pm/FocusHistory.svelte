<script lang="ts">
  /**
   * Read-only timeline view of historical focus lists (daily and weekly).
   * @component
   */
  import type { FocusDaily, FocusWeek } from '$lib/data/types.js'

  export type Props = {
    /** List of past daily focus entries to display. */
    dailyHistory: FocusDaily[];
    /** List of past weekly focus entries to display. */
    weekHistory: FocusWeek[];
    /** ID of the currently active daily list (highlighted in the sidebar). */
    currentDailyId: string;
    /** ID of the currently active weekly list (highlighted in the sidebar). */
    currentWeekId: string;
  }

  let {
    dailyHistory,
    weekHistory,
    currentDailyId,
    currentWeekId,
  }: Props = $props()
</script>

<aside class="flex flex-col gap-4">
  <div>
    <h3 class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Daily History</h3>
    <ul class="space-y-0.5">
      {#each dailyHistory as list}
        <li>
          <a
            href="/pm/focus/{list.id}"
            class="flex items-center justify-between rounded px-2 py-1 text-xs transition-colors
              {list.id === currentDailyId
                ? 'bg-blue-900/50 text-blue-300'
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}"
          >
            <span>{list.date}</span>
            <span class="{list.status === 'archived' ? 'text-gray-600' : 'text-gray-500'}">
              {list.items.filter(i => i.done).length}/{list.items.length}
            </span>
          </a>
        </li>
      {/each}
    </ul>
  </div>

  <div>
    <h3 class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Weekly History</h3>
    <ul class="space-y-0.5">
      {#each weekHistory as list}
        <li>
          <a
            href="/pm/focus/{list.id}"
            class="flex items-center justify-between rounded px-2 py-1 text-xs transition-colors
              {list.id === currentWeekId
                ? 'bg-blue-900/50 text-blue-300'
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}"
          >
            <span>{list.week}</span>
            <span class="{list.status === 'archived' ? 'text-gray-600' : 'text-gray-500'}">
              {list.items.filter(i => i.done).length}/{list.items.length}
            </span>
          </a>
        </li>
      {/each}
    </ul>
  </div>
</aside>
