import { dataPath, readRaw, writeRaw } from "$lib/data/parser.js";
import { error, fail } from "@sveltejs/kit";
import { Effect, pipe } from "effect";
import type { Actions, PageServerLoad } from "./$types.js";
import { runPromise } from "effect/Micro";

const filePath = (id: string) => `${dataPath("CRM", "contacts")}/${id}.md`;

export const load: PageServerLoad = async ({ params }) => {
  const result = await pipe(
    params.id,
    filePath,
    readRaw,
    Effect.either,
    Effect.runPromise,
  );

  if (result._tag === "Left") throw error(404, "Contact not found");
  return { content: result.right, id: params.id };
};

export const actions: Actions = {
  save: async ({ params, request }) => {
    const data = await request.formData();
    const content = data.get("content") as string;
    const result = await Effect.either(
      writeRaw(filePath(params.id), content),
    ).pipe(Effect.runPromise);

    if (result._tag === "Left") return fail(500, { error: "Failed to save" });
    return { success: true };
  },
};
