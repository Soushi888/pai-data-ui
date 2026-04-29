# Development Guide

This guide covers the day-to-day developer workflow, architectural patterns, and conventions used in pai-data-ui. For initial environment setup (Node, Bun, dependencies, environment variables), see [README.md](../README.md).

---

## Dev Workflow

All scripts are run with `bun run <script>` unless noted otherwise.

| Script | Command | Description |
|---|---|---|
| `dev` | `bun run dev` | Start the Vite development server at `http://localhost:5173` with hot module replacement. |
| `build` | `bun run build` | Compile the SvelteKit app for production into the `build/` directory. |
| `preview` | `bun run preview` | Serve the production build locally for smoke-testing before deployment. |
| `prepare` | `bun run prepare` | Run `svelte-kit sync` to generate SvelteKit type stubs. Runs automatically on `bun install`. |
| `check` | `bun run check` | Run `svelte-check` and `tsc` against the project. Fails on type errors or Svelte-specific issues. |
| `check:watch` | `bun run check:watch` | Same as `check` but reruns automatically on file changes. Useful during active development. |
| `build:binary` | `bun run build:binary` | Compile `scripts/launcher.ts` into the standalone `./pai-data-ui` binary using Bun's single-file compile. |
| `start` | `bun run start` | Execute the compiled `./pai-data-ui` binary directly. Requires `build:binary` to have run first. |
| `rebuild-index` | `bun run rebuild-index` | Trigger a full rebuild of the SQLite FTS index by running `scripts/rebuild-index.ts`. |

---

## How to Add a New Domain

A "domain" is a cohesive set of entities (e.g. contacts, invoices, tasks) that share a data directory and a set of CRUD operations. Follow the steps below. Use the CRM contacts implementation as the reference pattern throughout.

### Step 1: Define the TypeScript interface

Open `src/lib/data/types.ts` and add an interface for the new entity. Every entity interface must include `id: string` and `type: string` as required fields. The `type` value must be a unique string literal discriminant across all domains (e.g. `"contact"`, `"invoice"`, `"task"`).

```ts
export interface Widget {
  id: string
  type: 'widget'
  name: string
  created: string
  // ... additional fields
}
```

### Step 2: Choose a file naming convention

Pick a prefix for the domain's markdown files that follows the existing conventions in `DATA_ROOT`. The prefix must be unique to the domain.

| Domain | File pattern | Example |
|---|---|---|
| CRM contacts | `contact-{slug}.md` | `contact-jane-doe.md` |
| ERP invoices | `inv-{slug}.md` | `inv-IN000042.md` |
| PM projects | `proj-{slug}.md` | `proj-acme-website.md` |
| New widgets | `widget-{slug}.md` | `widget-my-first.md` |

Files live under `DATA_ROOT/{DOMAIN_DIR}/`, for example `DATA_ROOT/PM/widgets/`.

### Step 3: Create the data module

Create `src/lib/data/widgets.ts`. Model it on `src/lib/data/contacts.ts`. The key elements are:

- A `dir()` helper that returns `dataPath('PM', 'widgets')` (or whichever subdirectory you chose).
- A `filePath(id)` helper that returns the absolute path for a given entity ID.
- A `list` function that reads from the SQLite index via `listByType`. Do not walk the filesystem directly for list operations; the index is the authoritative source for queries.
- A `get` function that uses `requireEntity` for single-entity reads (reads from disk, not the index).
- A `create` function that generates a slug-based `id`, populates `type`, `created`, and writes via `writeEntity`.
- An `update` function that reads the existing entity, merges a `Partial<Widget>` patch, and writes back.

```ts
import { existsSync } from 'node:fs'
import { Effect as E } from 'effect'
import type { DataError } from './errors.js'
import { FileNotFoundError, ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType } from '$lib/server/index-db.js'
import type { Widget, EntityWithBody } from './types.js'

const dir = () => dataPath('PM', 'widgets')
const filePath = (id: string) => `${dir()}/${id}.md`

export function listWidgets(): E.Effect<Widget[], DataError> {
  return E.try({
    try: () => listByType<Widget>('widget'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}

export function getWidget(id: string): E.Effect<EntityWithBody<Widget>, DataError> {
  return requireEntity<Widget>(filePath(id), id)
}

export function createWidget(
  data: Omit<Widget, 'id' | 'type' | 'created'>,
  body = '',
): E.Effect<Widget, DataError> {
  const id = `widget-${data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
  const widget: Widget = { ...data, id, type: 'widget', created: new Date().toISOString().split('T')[0] }
  if (existsSync(filePath(id))) {
    return E.fail(new FileNotFoundError({ id: 'conflict' }))
  }
  return E.map(writeEntity(filePath(id), widget as unknown as Record<string, unknown>, body), () => widget)
}

export function updateWidget(
  id: string,
  patch: Partial<Widget>,
  body?: string,
): E.Effect<Widget, DataError> {
  return E.flatMap(getWidget(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch }
    return E.map(
      writeEntity(filePath(id), updated as unknown as Record<string, unknown>, body ?? existingBody),
      () => updated,
    )
  })
}
```

### Step 4: Add API routes

Create a directory `src/routes/api/widgets/` and add `+server.ts` files for each operation you need to expose. SvelteKit's `RequestHandler` receives `request`, `params`, and `platform`. Use the Effect unwrap pattern (see [Effect TS Pattern](#effect-ts-pattern)) to call your data module functions and return JSON responses.

A minimal GET handler for a list endpoint looks like:

```ts
// src/routes/api/widgets/+server.ts
import { json } from '@sveltejs/kit'
import { Effect } from 'effect'
import { listWidgets } from '$lib/data/widgets.js'

export const GET = async () => {
  const result = await Effect.runPromise(Effect.either(listWidgets()))
  if (result._tag === 'Left') {
    return json({ error: result.left.message }, { status: 500 })
  }
  return json(result.right)
}
```

For operations on a specific entity, use `src/routes/api/widgets/[id]/+server.ts` and read `params.id` from the handler arguments.

### Step 5: Add page routes

Create `src/routes/widgets/` with the standard SvelteKit files:

- `+page.server.ts` for the list page, which loads data server-side and passes it to the page component.
- `+page.svelte` for the rendered list view.
- `[id]/+page.server.ts` and `[id]/+page.svelte` for the detail/edit view.

The page server load functions follow the same Effect unwrap pattern as API routes. Throw a SvelteKit `error()` on the Left branch to produce the correct HTTP error page.

```ts
// src/routes/widgets/+page.server.ts
import { error } from '@sveltejs/kit'
import { Effect } from 'effect'
import { listWidgets } from '$lib/data/widgets.js'

export const load = async () => {
  const result = await Effect.runPromise(Effect.either(listWidgets()))
  if (result._tag === 'Left') throw error(500, 'Failed to load widgets')
  return { widgets: result.right }
}
```

### Step 6: Register with the sync engine if needed

The sync engine picks up new markdown files automatically as long as they live under `DATA_ROOT` in a non-skipped directory. You do not need to modify `sync-engine.ts` for normal domain additions.

If your write operations need to trigger immediate index updates without waiting for chokidar (for example in test environments or scripts), call `registerWriteHook` from `src/lib/data/parser.ts` after creating your data module. Pass a callback that calls `syncFile` or `upsertEntityInDb` directly. In production this is not required because chokidar handles the propagation.

---

## Effect TS Pattern

All data layer functions return `Effect<T, DataError>` from the Effect library. This means the return value is a lazy description of a computation that may succeed with `T` or fail with a typed `DataError`.

The four error types in `src/lib/data/errors.ts` are:

| Error class | When it is raised |
|---|---|
| `FileNotFoundError` | The requested entity file does not exist on disk. |
| `ParseError` | A file cannot be read or its YAML frontmatter is malformed. |
| `ValidationError` | Entity data fails a validation rule. |
| `WriteError` | Writing to a file fails (permissions, disk full, etc.). |

To run an Effect in a SvelteKit server route or load function, use `Effect.runPromise` combined with `Effect.either`. `Effect.either` wraps the computation so that errors become a `Left` value rather than rejected promises, giving you a clean branch point:

```ts
import { Effect } from 'effect'

const result = await Effect.runPromise(Effect.either(someEffect()))

if (result._tag === 'Left') {
  // result.left is the DataError; access result.left._tag to discriminate the error type
  console.error(result.left)
  return json({ error: 'Something went wrong' }, { status: 500 })
}

const value = result.right  // typed as T
```

The `_tag` field on the Left value matches the class name declared with `Data.TaggedError` in `errors.ts` (e.g. `"FileNotFoundError"`, `"ParseError"`). You can switch on `result.left._tag` to return different HTTP status codes for different error types: 404 for `FileNotFoundError`, 400 for `ValidationError`, 500 for `ParseError` and `WriteError`.

Inside data module functions, compose operations with `E.flatMap`, `E.map`, and `E.try` / `E.tryPromise`. Never use `await` directly inside a data module; keep all async operations wrapped in Effect constructors so the error channel stays typed.

---

## SQLite Index Lifecycle

### Automatic rebuild on server start

When the SvelteKit server starts, `src/hooks.server.ts` calls `syncEngine.start()`. The `SyncEngine.start()` method is idempotent; subsequent calls after the first are no-ops. On the first call, it runs `rebuildIndex()`, which walks every `.md` file under `DATA_ROOT` recursively, upserts each parsed entity into the `entities` table, and removes rows for files that no longer exist on disk. The rebuild result is logged as `{ indexed: N, errors: N }`.

### Incremental updates via chokidar

After the initial rebuild, `SyncEngine` attaches a chokidar watcher on `DATA_ROOT/**/*.md`. The watcher fires on three events:

- `add`: a new file appeared; the file is parsed and upserted into the index.
- `change`: an existing file was modified; the index row is updated in place.
- `unlink`: a file was deleted; the corresponding row is removed from `entities`.

The watcher skips the directories `_schemas`, `_templates`, `_index`, `exports`, and `context`, as well as any path segment that starts with a dot.

### Manual rebuild

To force a complete index rebuild without restarting the server, run:

```bash
bun run rebuild-index
```

This executes `scripts/rebuild-index.ts`, which calls `rebuildIndex()` directly and prints the result.

### The sync_errors table

When a file cannot be parsed (malformed YAML frontmatter) or is missing the required `id` or `type` frontmatter fields, the sync engine inserts a row into the `sync_errors` table instead of updating `entities`. Each row records the file path, error type (`parse_error` or `missing_id`), a human-readable message, and a raw excerpt of the file contents. When the underlying file is later fixed and re-synced, the error row is marked resolved via `resolved_at`. Query `sync_errors WHERE resolved_at IS NULL` to find currently broken files.

---

## Code Style

The project uses [Biome](https://biomejs.dev) for formatting and linting. The configuration is in `biome.json` at the project root. Key settings:

| Setting | Value |
|---|---|
| Indent style | spaces |
| Indent width | 2 |
| Line width | 100 |
| Quote style (JS/TS) | single quotes |
| Semicolons | omitted (no trailing semicolons) |
| Linter rule set | Biome recommended |
| Import organization | enabled |

To format and lint all files in one pass:

```bash
bunx biome check --write .
```

This applies the formatter, auto-fixes safe linting issues, and organizes imports. Run this before committing. If you want to check without applying changes (for CI or review), omit `--write`:

```bash
bunx biome check .
```

TypeScript is configured in `tsconfig.json` with strict mode enabled. Do not disable strict checks or add `@ts-ignore` without a documented reason.

---

## Type Checking

SvelteKit requires its own type generation step (`svelte-kit sync`) before `tsc` can resolve Svelte component types. The `check` script handles both in the correct order:

```bash
bun run check
```

This runs `svelte-kit sync` followed by `svelte-check --tsconfig ./tsconfig.json`. `svelte-check` catches type errors inside `.svelte` files as well as standard TypeScript errors in `.ts` files. Run this before pushing to catch issues that the editor's language server may not surface.

For active development with continuous feedback, use the watch variant:

```bash
bun run check:watch
```

This reruns the check on every file change, printing errors and clearing them as you work. It does not block the terminal when there are no errors.
