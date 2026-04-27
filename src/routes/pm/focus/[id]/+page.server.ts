import { error } from "@sveltejs/kit";
import { Effect as E } from "effect";
import { getFocusList } from "$lib/data/focus.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const result = await E.runPromise(E.either(getFocusList(params.id)));
  if (result._tag === "Left") error(404, "Focus list not found");
  return { list: result.right.data, body: result.right.body, id: params.id };
};
