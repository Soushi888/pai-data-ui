import { json } from "@sveltejs/kit";
import { Effect } from "effect";
import { getFocusList, updateFocusList } from "$lib/data/focus.js";
import type { FocusList } from "$lib/data/types.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  const result = await Effect.runPromise(
    Effect.either(getFocusList(params.id))
  );
  if (result._tag === "Left") return json({ error: "Not found" }, { status: 404 });
  return json({ list: result.right.data, body: result.right.body });
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  const patch = await request.json();
  const result = await Effect.runPromise(
    Effect.either(updateFocusList<FocusList>(params.id, patch))
  );
  if (result._tag === "Left") return json({ error: "Failed to update" }, { status: 500 });
  return json({ list: result.right });
};
