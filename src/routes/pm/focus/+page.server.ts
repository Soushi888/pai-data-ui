import { Effect } from "effect";
import { getFocusList, listFocusDaily, listFocusWeek, todayDailyId, currentWeekId } from "$lib/data/focus.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const dailyId = todayDailyId();
  const weekId = currentWeekId();

  const [dailyR, weekR, allDailyR, allWeekR] = await Promise.all([
    Effect.runPromise(Effect.either(getFocusList(dailyId))),
    Effect.runPromise(Effect.either(getFocusList(weekId))),
    Effect.runPromise(Effect.either(listFocusDaily())),
    Effect.runPromise(Effect.either(listFocusWeek())),
  ]);

  const daily = dailyR._tag === "Right" ? dailyR.right.data : null;
  const week = weekR._tag === "Right" ? weekR.right.data : null;

  const allDaily = allDailyR._tag === "Right"
    ? allDailyR.right.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
    : [];
  const allWeek = allWeekR._tag === "Right"
    ? allWeekR.right.sort((a, b) => b.week.localeCompare(a.week)).slice(0, 4)
    : [];

  return { daily, week, dailyId, weekId, allDaily, allWeek };
};
