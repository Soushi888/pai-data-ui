import { dataPath, readRaw, writeRaw } from "$lib/data/parser.js";
import { error } from "@sveltejs/kit";
import { Effect, pipe } from "effect";
import type { PageServerLoad } from "./$types.js";
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
