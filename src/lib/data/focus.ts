import { Effect, pipe } from "effect";
import type { DataError } from "./errors.js";
import { ParseError } from "./errors.js";
import { dataPath, requireEntity, writeEntity } from "./parser.js";
import { listByType } from "$lib/server/index-db.js";
import type {
  EntityWithBody,
  FocusDaily,
  FocusList,
  FocusItem,
  FocusWeek,
} from "./types.js";

const dir = () => dataPath("PM", "focus");
const filePath = (id: string) => `${dir()}/${id}.md`;
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));

  const timeZone = Date.UTC(date.getUTCFullYear(), 0, 1);
  const yearStart = new Date(timeZone);

  const weekNum = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function todayDailyId(): string {
  return `focus-daily-${today()}`;
}

export function currentWeekId(): string {
  return `focus-week-${isoWeek(new Date())}`;
}

export function listFocusDaily(): Effect.Effect<FocusDaily[], DataError> {
  return Effect.try({
    try: () => listByType<FocusDaily>("focus-daily"),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  });
}

export function listFocusWeek(): Effect.Effect<FocusWeek[], DataError> {
  return Effect.try({
    try: () => listByType<FocusWeek>("focus-week"),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  });
}

export function getFocusList<T extends FocusList>(
  id: string,
): Effect.Effect<EntityWithBody<T>, DataError> {
  return requireEntity<T>(filePath(id), id);
}

export function createFocusList<T extends FocusList>(
  data: T,
  body = "",
): Effect.Effect<T, DataError> {
  return Effect.map(
    writeEntity(
      filePath(data.id),
      data as unknown as Record<string, unknown>,
      body,
    ),
    () => data,
  );
}

export function updateFocusList<T extends FocusList>(
  id: string,
  patch: Partial<T>,
  body?: string,
): Effect.Effect<T, DataError> {
  return Effect.flatMap(getFocusList<T>(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch, updated: today() };
    return Effect.map(
      writeEntity(
        filePath(id),
        updated as unknown as Record<string, unknown>,
        body ?? existingBody,
      ),
      () => updated as T,
    );
  });
}

export function toggleItem(
  id: string,
  itemId: string,
): Effect.Effect<FocusList, DataError> {
  return Effect.flatMap(getFocusList(id), ({ data, body }) => {
    const updatedItems = (data.items as FocusItem[]).map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    );
    return updateFocusList(
      id,
      { items: updatedItems } as Partial<FocusList>,
      body,
    );
  });
}

export function addItem(
  id: string,
  text: string,
  linkedRef?: string,
): Effect.Effect<FocusList, DataError> {
  return Effect.flatMap(getFocusList(id), ({ data, body }) => {
    const nextId = `item-${data.items.length + 1}`;
    const newItem: FocusItem = {
      id: nextId,
      text,
      done: false,
      ...(linkedRef ? { linked_ref: linkedRef } : {}),
    };
    return updateFocusList(
      id,
      { items: [...data.items, newItem] } as Partial<FocusList>,
      body,
    );
  });
}
