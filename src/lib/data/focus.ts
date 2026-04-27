import { Effect as E, pipe } from "effect";
import type { DataError } from "./errors.js";
import { ParseError } from "./errors.js";
import { dataPath, requireEntity, writeEntity } from "./parser.js";
import { listByType, getDb } from "$lib/server/index-db.js";
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
export function listFocusDaily(): E.Effect<FocusDaily[], DataError> {
  return E.try({
    try: () => listByType<FocusDaily>("focus-daily"),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  });
}

/**
 * Lists all weekly focus lists.
 * @returns Effect resolving to FocusWeek[], or failing with DataError.
 */
export function listFocusWeek(): E.Effect<FocusWeek[], DataError> {
  return E.try({
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
): E.Effect<EntityWithBody<T>, DataError> {
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
): E.Effect<T, DataError> {
  return E.map(
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
): E.Effect<T, DataError> {
  return E.flatMap(getFocusList<T>(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch, updated: today() };
    return E.map(
      writeEntity(
        filePath(id),
        updated as unknown as Record<string, unknown>,
        body ?? existingBody,
      ),
      () => updated as T,
    );
  });
}

function cycleItemState(item: FocusItem): FocusItem {
  if (item.done) return { ...item, done: false, in_progress: false };
  if (item.in_progress) return { ...item, done: true, in_progress: false };
  return { ...item, done: false, in_progress: true };
}

/**
 * Cycles the state of an item within a focus list: pending → in_progress → done → pending.
 * @param id - Focus list identifier.
 * @param itemId - Identifier of the focus item to cycle within the list.
 * @returns Effect resolving to the updated focus list, or failing with DataError.
 */
export function toggleItem(
  id: string,
  itemId: string,
): E.Effect<FocusList, DataError> {
  return E.flatMap(getFocusList(id), ({ data, body }) => {
    const updatedItems = (data.items as FocusItem[]).map((item) =>
      item.id === itemId ? cycleItemState(item) : item,
    );
    return updateFocusList(
      id,
      { items: updatedItems } as Partial<FocusList>,
      body,
    );
  });
}

/**
 * Lists daily focus lists whose date falls within the last N calendar days.
 * When days is 'all', returns every daily list.
 * @param days - Number of days to look back, or 'all' for full history.
 * @returns Effect resolving to FocusDaily[], or failing with DataError.
 */
export function listFocusDailyInRange(days: number | 'all'): E.Effect<FocusDaily[], DataError> {
  return E.try({
    try: () => {
      if (days === 'all') {
        return listByType<FocusDaily>('focus-daily');
      }
      const rows = getDb()
        .prepare(
          `SELECT data FROM entities
           WHERE type = 'focus-daily'
             AND json_extract(data, '$.date') >= date('now', ?)
           ORDER BY json_extract(data, '$.date') DESC`
        )
        .all(`-${days} days`) as { data: string }[];
      return rows.map((r) => JSON.parse(r.data) as FocusDaily);
    },
    catch: (e) => new ParseError({ file: dir(), cause: e }),
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
): E.Effect<FocusList, DataError> {
  return E.flatMap(getFocusList(id), ({ data, body }) => {
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
