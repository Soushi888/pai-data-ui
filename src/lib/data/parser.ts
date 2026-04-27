import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Effect as E } from "effect";
import matter from "gray-matter";
import { FileNotFoundError, ParseError, WriteError } from "./errors.js";
import type { EntityWithBody } from "./types.js";

/** Root path to the PAI data directory. Defaults to ~/.claude/PAI/USER/DATA, overridable via PAI_DATA_ROOT env var. */
export const DATA_ROOT =
  process.env.PAI_DATA_ROOT ?? `${process.env.HOME}/.claude/PAI/USER/DATA`;

type WriteHook = (filePath: string, data: Record<string, unknown>, body: string) => void
let _writeHook: WriteHook | null = null

/**
 * Registers a callback fired after every successful writeEntity call.
 * Used for sync/indexing side effects. Only one hook can be registered at a time — each call replaces the previous hook.
 * @param hook - Callback invoked with the file path, serialized entity data, and markdown body.
 */
export function registerWriteHook(hook: WriteHook): void {
  _writeHook = hook
}

/**
 * Joins DATA_ROOT with the given path segments to build an absolute file path.
 * @param segments - Path segments to append to DATA_ROOT.
 * @returns Absolute path rooted at DATA_ROOT.
 */
export function dataPath(...segments: string[]): string {
  return join(DATA_ROOT, ...segments);
}

/**
 * Reads and parses a markdown file with YAML frontmatter into a typed entity.
 * @param filePath - Absolute path to the .md file.
 * @returns Effect resolving to the parsed entity data and trimmed markdown body, or failing with ParseError on I/O or parse failure.
 */
export function readEntity<T>(
  filePath: string,
): E.Effect<EntityWithBody<T>, ParseError> {
  return E.tryPromise({
    try: async () => {
      const raw = await readFile(filePath, "utf8");
      const { data, content } = matter(raw);
      return { data: data as T, body: content.trim() };
    },
    catch: (e) => new ParseError({ file: filePath, cause: e }),
  });
}

/**
 * Serializes entity data and body back to a markdown file with YAML frontmatter.
 * Fires the registered write hook (if any) after a successful write.
 * @param filePath - Absolute path to the .md file to write.
 * @param data - Entity data to serialize as YAML frontmatter.
 * @param body - Markdown body content written below the frontmatter delimiter.
 * @returns Effect resolving to void on success, or failing with WriteError.
 */
export function writeEntity<T extends Record<string, unknown>>(
  filePath: string,
  data: T,
  body: string,
): E.Effect<void, WriteError> {
  return E.tap(
    E.tryPromise({
      try: () => writeFile(filePath, matter.stringify(body || "", data), "utf8"),
      catch: (e) => new WriteError({ file: filePath, cause: e }),
    }),
    () => {
      try { _writeHook?.(filePath, data as Record<string, unknown>, body) } catch { /* best effort */ }
      return E.void
    }
  )
}

/**
 * Lists all .md filenames in a directory as absolute paths.
 * @param dir - Absolute path to the directory to read.
 * @returns Effect resolving to an array of absolute .md file paths, or failing with ParseError on I/O failure.
 */
export function listDir(dir: string): E.Effect<string[], ParseError> {
  return E.tryPromise({
    try: async () => {
      const entries = await readdir(dir);
      return entries.filter((f) => f.endsWith(".md")).map((f) => join(dir, f));
    },
    catch: (e) => new ParseError({ file: dir, cause: e }),
  });
}

/**
 * Extracts the entity ID from a file path by stripping the directory path and .md extension.
 * @param filePath - Absolute or relative path to the .md file.
 * @returns The bare filename without path or extension (e.g. "john-doe" from "/CRM/contacts/john-doe.md").
 */
export function entityId(filePath: string): string {
  return filePath.split("/").pop()!.replace(/\.md$/, "");
}

/**
 * Reads a file as a raw UTF-8 string without any parsing.
 * @param filePath - Absolute path to the file to read.
 * @returns Effect resolving to the raw file contents, or failing with ParseError on I/O failure.
 */
export function readRaw(filePath: string): E.Effect<string, ParseError> {
  return E.tryPromise({
    try: () => readFile(filePath, "utf8"),
    catch: (e) => new ParseError({ file: filePath, cause: e }),
  });
}

/**
 * Writes a raw string to a file as UTF-8 without any frontmatter serialization.
 * @param filePath - Absolute path to the file to write.
 * @param content - Raw string content to write.
 * @returns Effect resolving to void on success, or failing with WriteError.
 */
export function writeRaw(
  filePath: string,
  content: string,
): E.Effect<void, WriteError> {
  return E.tryPromise({
    try: () => writeFile(filePath, content, "utf8"),
    catch: (e) => new WriteError({ file: filePath, cause: e }),
  });
}

/**
 * Reads an entity or fails with FileNotFoundError if the file is missing.
 * Wraps readEntity with a missing-file check: any read failure is mapped to FileNotFoundError keyed by id.
 * @param filePath - Absolute path to the .md file.
 * @param id - Entity ID used to populate the FileNotFoundError if the file cannot be read.
 * @returns Effect resolving to the parsed entity data and body, or failing with FileNotFoundError.
 */
export function requireEntity<T>(
  filePath: string,
  id: string,
): E.Effect<EntityWithBody<T>, ParseError | FileNotFoundError> {
  return E.catchAll(readEntity<T>(filePath), () =>
    E.fail(new FileNotFoundError({ id })),
  );
}
