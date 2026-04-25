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

/**
 * Computes the ISO 8601 week string for a given date.
 * @param d - The date to compute the week for.
 * @returns ISO week string in format "YYYY-Www" (e.g. "2026-W17").
 */
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

/**
 * Returns the focus-daily list ID for today's date.
 * @returns ID string in format "focus-daily-YYYY-MM-DD".
 */
export function todayDailyId(): string {
  return `focus-daily-${today()}`;
}

/**
 * Returns the focus-week list ID for the current ISO week.
 * @returns ID string in format "focus-week-YYYY-Www" (e.g. "focus-week-2026-W17").
 */
export function currentWeekId(): string {
  return `focus-week-${isoWeek(new Date())}`;
}

/**
 * Lists all daily focus lists.
 * @returns Effect resolving to FocusDaily[], or failing with DataError.
 */
export function listFocusDaily(): Effect.Effect<FocusDaily[], DataError> {
  return Effect.try({
    try: () => listByType<FocusDaily>("focus-daily"),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  });
}

/**
 * Lists all weekly focus lists.
 * @returns Effect resolving to FocusWeek[], or failing with DataError.
 */
export function listFocusWeek(): Effect.Effect<FocusWeek[], DataError> {
  return Effect.try({
    try: () => listByType<FocusWeek>("focus-week"),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  });
}

/**
 * Retrieves a focus list by ID (daily or weekly) with its markdown body.
 * @param id - Focus list identifier, e.g. "focus-daily-2026-04-24" or "focus-week-2026-W17".
 * @returns Effect resolving to the typed focus list data + body, or failing with DataError.
 */
export function getFocusList<T extends FocusList>(
  id: string,
): Effect.Effect<EntityWithBody<T>, DataError> {
  return requireEntity<T>(filePath(id), id);
}

/**
 * Creates a new focus list (daily or weekly).
 * @param data - Focus list data to persist.
 * @param body - Optional initial markdown body.
 * @returns Effect resolving to the created list, or failing with DataError.
 */
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

/**
 * Updates a focus list with a partial patch.
 * Infers whether the list is daily or weekly from the ID prefix ("focus-daily-" or "focus-week-").
 * @param id - Focus list identifier.
 * @param patch - Partial fields to update.
 * @param body - Optional replacement markdown body.
 * @returns Effect resolving to the updated list, or failing with DataError.
 */
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

/**
 * Toggles the done status of an item within a focus list.
 * @param id - Focus list identifier.
 * @param itemId - Identifier of the focus item to toggle within the list.
 * @returns Effect resolving to the updated focus list, or failing with DataError.
 */
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

/**
 * Adds a new item to a focus list.
 * @param id - Focus list identifier.
 * @param text - Display text for the new focus item.
 * @param linkedRef - Optional reference to a related PAI entity (e.g. a task ID).
 * @returns Effect resolving to the updated focus list, or failing with DataError.
 */
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
