import { json } from "@sveltejs/kit";
import { Effect as E } from "effect";
import { moveFocusItem } from "$lib/data/focus.js";
import type { RequestHandler } from "./$types";

/**
 * Moves a focus item from one list to another atomically.
 * Body: { fromId: string, toId: string, itemId: string, toIndex?: number }
 */
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { fromId, toId, itemId, toIndex } = body ?? {};

  if (
    typeof fromId !== "string" ||
    typeof toId !== "string" ||
    typeof itemId !== "string"
  ) {
    return json({ error: "fromId, toId and itemId are required" }, { status: 400 });
  }
  if (fromId === toId) {
    return json({ error: "fromId and toId must differ" }, { status: 400 });
  }

  const result = await E.runPromise(
    E.either(
      moveFocusItem(
        fromId,
        toId,
        itemId,
        typeof toIndex === "number" ? toIndex : undefined,
      ),
    ),
  );
  if (result._tag === "Left") {
    return json({ error: "Failed to move item" }, { status: 500 });
  }
  return json({ from: result.right.from, to: result.right.to });
};
