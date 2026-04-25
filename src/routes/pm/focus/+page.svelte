<script lang="ts">
  import FocusListPanel from '$lib/components/pm/FocusListPanel.svelte'
  import FocusHistory from '$lib/components/pm/FocusHistory.svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>Focus</title>
</svelte:head>

<div class="flex gap-6 p-6">
  <div class="flex flex-1 flex-col gap-6">
    <header>
      <h1 class="text-lg font-semibold text-gray-100">Focus</h1>
      <p class="text-xs text-gray-500">Daily and weekly objectives</p>
    </header>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <FocusListPanel
        list={data.daily}
        listId={data.dailyId}
        type="focus-daily"
        label="Today"
      />
      <FocusListPanel
        list={data.week}
        listId={data.weekId}
        type="focus-week"
        label="This Week"
      />
    </div>
  </div>

  <div class="w-40 flex-shrink-0">
    <FocusHistory
      dailyHistory={data.allDaily}
      weekHistory={data.allWeek}
      currentDailyId={data.dailyId}
      currentWeekId={data.weekId}
    />
  </div>
</div>
