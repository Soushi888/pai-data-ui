import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Effect } from "effect";
import matter from "gray-matter";
import { FileNotFoundError, ParseError, WriteError } from "./errors.js";
import type { EntityWithBody } from "./types.js";

export const DATA_ROOT =
  process.env.PAI_DATA_ROOT ?? `${process.env.HOME}/.claude/PAI/USER/DATA`;

export function dataPath(...segments: string[]): string {
  return join(DATA_ROOT, ...segments);
}

export function readEntity<T>(
  filePath: string,
): Effect.Effect<EntityWithBody<T>, ParseError> {
  return Effect.tryPromise({
    try: async () => {
      const raw = await readFile(filePath, "utf8");
      const { data, content } = matter(raw);
      return { data: data as T, body: content.trim() };
    },
    catch: (e) => new ParseError({ file: filePath, cause: e }),
  });
}

export function writeEntity<T extends Record<string, unknown>>(
  filePath: string,
  data: T,
  body: string,
): Effect.Effect<void, WriteError> {
  return Effect.tryPromise({
    try: () => writeFile(filePath, matter.stringify(body || "", data), "utf8"),
    catch: (e) => new WriteError({ file: filePath, cause: e }),
  });
}

export function listDir(dir: string): Effect.Effect<string[], ParseError> {
  return Effect.tryPromise({
    try: async () => {
      const entries = await readdir(dir);
      return entries.filter((f) => f.endsWith(".md")).map((f) => join(dir, f));
    },
    catch: (e) => new ParseError({ file: dir, cause: e }),
  });
}

export function entityId(filePath: string): string {
  return filePath.split("/").pop()!.replace(/\.md$/, "");
}

export function requireEntity<T>(
  filePath: string,
  id: string,
): Effect.Effect<EntityWithBody<T>, ParseError | FileNotFoundError> {
  return Effect.catchAll(readEntity<T>(filePath), () =>
    Effect.fail(new FileNotFoundError({ id })),
  );
}
