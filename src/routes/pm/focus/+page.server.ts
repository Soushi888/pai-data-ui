import { Effect as E } from "effect";
import {
  getFocusList,
  listFocusDaily,
  listFocusWeek,
  todayDailyId,
  currentWeekId,
  listFocusDailyInRange,
} from "$lib/data/focus.js";
import type { UnfinishedGroup } from "$lib/data/types.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const dailyId = todayDailyId();
  const weekId = currentWeekId();

  const _d = new Date();
  const _t = new Date(_d);
  _t.setDate(_d.getDate() + 1);
  const tomorrowDate = `${_t.getFullYear()}-${String(_t.getMonth() + 1).padStart(2, "0")}-${String(_t.getDate()).padStart(2, "0")}`;
  const tomorrowId = `focus-daily-${tomorrowDate}`;

  const [dailyR, weekR, allDailyR, allWeekR, tomorrowR, unfinishedR] =
    await Promise.all([
      E.runPromise(E.either(getFocusList(dailyId))),
      E.runPromise(E.either(getFocusList(weekId))),
      E.runPromise(E.either(listFocusDaily())),
      E.runPromise(E.either(listFocusWeek())),
      E.runPromise(E.either(getFocusList(tomorrowId))),
      E.runPromise(E.either(listFocusDailyInRange(7))),
    ]);

  const daily = dailyR._tag === "Right" ? dailyR.right.data : null;
  const week = weekR._tag === "Right" ? weekR.right.data : null;

  const allDaily =
    allDailyR._tag === "Right"
      ? allDailyR.right.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
      : [];
  const allWeek =
    allWeekR._tag === "Right"
      ? allWeekR.right.sort((a, b) => b.week.localeCompare(a.week)).slice(0, 4)
      : [];

  const tomorrowExists = tomorrowR._tag === "Right";

  const unfinishedLists =
    unfinishedR._tag === "Right" ? unfinishedR.right : [];
  const initialUnfinished: UnfinishedGroup[] = unfinishedLists
    .map((list) => {
      const items = list.items
        .filter((i) => !i.done)
        .map((i) => ({
          itemId: i.id,
          text: i.text,
          in_progress: !!i.in_progress,
          ...(i.linked_ref ? { linked_ref: i.linked_ref } : {}),
        }));
      if (items.length === 0) return null;
      return {
        date: list.date,
        listId: list.id,
        listStatus: list.status,
        items,
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  return {
    daily,
    week,
    dailyId,
    weekId,
    allDaily,
    allWeek,
    tomorrowExists,
    tomorrowId,
    tomorrowDate,
    initialUnfinished,
  };
};
