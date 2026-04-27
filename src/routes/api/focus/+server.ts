import { json } from "@sveltejs/kit";
import { Effect as E } from "effect";
import {
  createFocusList,
  isoWeek,
  listFocusDaily,
  listFocusWeek,
} from "$lib/data/focus.js";
import type { FocusDaily, FocusWeek } from "$lib/data/types.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  const type = url.searchParams.get("type");
  if (type === "focus-daily") {
    const result = await E.runPromise(E.either(listFocusDaily()));
    if (result._tag === "Left") return json({ lists: [] });
    return json({ lists: result.right.sort((a, b) => b.date.localeCompare(a.date)) });
  }
  if (type === "focus-week") {
    const result = await E.runPromise(E.either(listFocusWeek()));
    if (result._tag === "Left") return json({ lists: [] });
    return json({ lists: result.right.sort((a, b) => b.week.localeCompare(a.week)) });
  }
  const [dailyR, weekR] = await Promise.all([
    E.runPromise(E.either(listFocusDaily())),
    E.runPromise(E.either(listFocusWeek())),
  ]);
  return json({
    daily: dailyR._tag === "Right" ? dailyR.right : [],
    weekly: weekR._tag === "Right" ? weekR.right : [],
  });
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { type, date, week, items = [], carried_from } = body;

  const _d = new Date();
  const dateStr = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, "0")}-${String(_d.getDate()).padStart(2, "0")}`;

  if (type === "focus-daily") {
    const d = date ?? dateStr;
    const w = week ?? isoWeek(new Date(d));
    const id = `focus-daily-${d}`;
    const data: FocusDaily = {
      id,
      type: "focus-daily",
      date: d,
      week: w,
      status: "active",
      items,
      ...(carried_from ? { carried_from } : {}),
      created: dateStr,
      updated: dateStr,
    };
    const result = await E.runPromise(
      E.either(createFocusList(data, "\n## Intentions\n\n## Notes\n"))
    );
    if (result._tag === "Left") return json({ error: "Failed to create list" }, { status: 500 });
    return json({ list: result.right });
  }

  if (type === "focus-week") {
    const w = week ?? isoWeek(new Date());
    const id = `focus-week-${w}`;
    const data: FocusWeek = {
      id,
      type: "focus-week",
      week: w,
      status: "active",
      items,
      ...(carried_from ? { carried_from } : {}),
      created: dateStr,
      updated: dateStr,
    };
    const result = await E.runPromise(
      E.either(createFocusList(data, "\n## Weekly Intentions\n\n## Notes\n"))
    );
    if (result._tag === "Left") return json({ error: "Failed to create list" }, { status: 500 });
    return json({ list: result.right });
  }

  return json({ error: "type must be focus-daily or focus-week" }, { status: 400 });
};
