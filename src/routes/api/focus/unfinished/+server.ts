import { json } from "@sveltejs/kit";
import { Effect as E } from "effect";
import { listFocusDailyInRange } from "$lib/data/focus.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  const allParam = url.searchParams.get("all");
  const daysParam = url.searchParams.get("days");
  const days: number | "all" =
    allParam === "true" ? "all" : parseInt(daysParam ?? "7", 10) || 7;

  const result = await E.runPromise(
    E.either(listFocusDailyInRange(days))
  );
  if (result._tag === "Left") {
    return json({ groups: [], totalCount: 0, windowDays: days });
  }

  const groups = result.right
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
      return { date: list.date, listId: list.id, listStatus: list.status, items };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);
  return json({ groups, totalCount, windowDays: days });
};
