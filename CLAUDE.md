# pai-data-ui — Claude Code Context

SvelteKit web app that serves as the UI layer for PAI data. Reads and writes the same markdown files used by PAI CLI skills (CRM, ERP, Projects, Focus). Markdown is the source of truth — no separate database beyond the SQLite search index.

## Architecture

### Data Flow

```
DATA_ROOT ($PAI_DATA_ROOT or ~/.claude/PAI/USER/DATA)
  └── *.md files (YAML frontmatter + markdown body)
        ↕  gray-matter read/write
  SyncEngine (chokidar watcher + SQLite FTS index)
        ↕  better-sqlite3
  SvelteKit server routes (+page.server.ts / +server.ts)
        ↕  Effect TS typed errors
  Svelte 5 pages (runes)
```

### Key Modules

| Path | Role |
|---|---|
| `src/lib/server/index-db.ts` | SQLite singleton, schema init, CRUD helpers, FTS5 search |
| `src/lib/server/sync-engine.ts` | Chokidar watcher + initial `rebuildIndex()` on server start |
| `src/lib/data/types.ts` | All entity interfaces (Contact, Invoice, Task, FocusDaily, etc.) |
| `src/lib/data/*.ts` | Domain-specific read/write functions (Effect-wrapped) |
| `src/hooks.server.ts` | Starts `syncEngine` on server init |
| `scripts/launcher.ts` | Compiled into `./pai-data-ui` binary — spawns Node to run build/ |
| `scripts/tray.py` | Linux system tray (pystray + Pillow) — managed by systemd service |
| `scripts/install.sh` | One-shot installer: builds binary, writes systemd service + .desktop file |

### Routes

| Prefix | Domain |
|---|---|
| `/crm` | Contacts, Opportunities, Organizations |
| `/erp` | Invoices, Expenses, Income, Stats |
| `/pm` | Projects, Tasks, Focus (daily/weekly lists) |
| `/tags/[tag]` | Cross-domain tag index |
| `/search` | Global FTS across all entities |
| `/api/*` | JSON REST endpoints (used by Svelte pages) |

## Data Conventions

### File Naming

| Domain | Pattern | Example |
|---|---|---|
| CRM contacts | `contact-{slug}.md` | `contact-jane-doe.md` |
| CRM opportunities | `opp-{slug}.md` | `opp-acme-2026.md` |
| CRM organizations | `org-{slug}.md` | `org-acme-corp.md` |
| ERP invoices | `inv-{slug}.md` | `inv-IN000042.md` |
| ERP expenses | `exp-{slug}.md` | `exp-aws-hosting.md` |
| ERP income | `income-{slug}.md` | `income-tax-return-2026.md` |
| ERP payments | `pay-{slug}.md` | `pay-aws-2026-04.md` |
| PM projects | `proj-{slug}.md` | `proj-acme-website.md` |
| PM tasks | `task-{slug}.md` | `task-setup-ci.md` |
| PM focus | `focus-{date}.md` | `focus-2026-04-26.md` |

### Required Frontmatter Fields

Every entity file must have `id` (string) and `type` (string discriminant). Missing either causes a `sync_error` entry in SQLite. Entity IDs must be globally unique across all domains.

### SQLite Index

Located at `$DATA_ROOT/_index/pai.db`. The schema has:
- `entities` table: `id, type, domain, file_path, data (JSON), body, updated, indexed_at`
- `entities_fts` virtual table (FTS5): `name, tags, body` — full-text search
- `sync_errors` table: files that failed to parse or are missing required fields

The index is rebuilt on server start and kept live by the chokidar watcher. To force a manual rebuild: `bun rebuild-index`.

### Skipped Directories

`_schemas`, `_templates`, `_index`, `exports`, `context` are never walked by the sync engine.

## Effect TS Pattern

All data layer functions return `Effect<T, DataError>`. In server routes, unwrap with:

```ts
const result = await Effect.runPromise(Effect.either(someEffect()))
if (result._tag === 'Left') { /* handle error */ }
const value = result.right
```

## Dev Workflow

```bash
bun install          # install deps
bun run dev          # dev server at http://localhost:5173
bun run check        # svelte-check + TypeScript
bun rebuild-index    # manually rebuild the SQLite FTS index
bun run build        # production build to build/
bun run build:binary # compile launcher → ./pai-data-ui binary
```

## Production Deployment

The app runs as a **systemd user service** on Linux, managed by `scripts/install.sh`.

```bash
# One-time setup (builds, writes service file, .desktop entry)
bash scripts/install.sh

# Start/stop/restart
systemctl --user start pai-data-ui
systemctl --user stop  pai-data-ui

# Manual start (without systemd)
./pai-data-ui          # runs the compiled binary
```

The systemd service starts `scripts/tray.py` (pystray system tray), which in turn starts the binary. The `.desktop` file calls `scripts/start.sh`, which starts the service and opens the browser. Production port: **4173**.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PAI_DATA_ROOT` | `~/.claude/PAI/USER/DATA` | Absolute path to the PAI DATA directory |
| `PORT` | `4173` (prod) / `5173` (dev) | HTTP port |
| `ORIGIN` | `http://localhost:$PORT` | Canonical origin for adapter-node CSRF protection |
| `NODE_PATH` | `node` | Path to Node.js binary (set by systemd service) |

## Tech Stack

- SvelteKit 2 + Svelte 5 (runes), adapter-node
- TypeScript 6, Bun runtime
- Tailwind CSS v4 (dark theme)
- Effect TS (typed error handling in data layer)
- gray-matter (frontmatter parse/write)
- better-sqlite3 (SQLite FTS index)
- chokidar (file watcher for real-time sync)
- CodeMirror 6 (markdown + YAML editors)
- D3 (charts in ERP stats page)
- PDFKit (invoice PDF generation/export)
- marked (markdown → HTML rendering)
- Biome (formatting/linting)

## CLI Skills

The `skills/` directory contains PAI skill definitions to be symlinked or copied into `~/.claude/skills/`:

- `skills/CRM/` — CRM skill
- `skills/ERP/` — ERP skill (invoices, expenses, income)
- `skills/Projects/` — Projects skill
- `skills/DataLayer/` — DataLayer skill (domain scaffolding, schema management, index rebuild)
