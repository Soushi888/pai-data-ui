# PAI Data UI

Local SvelteKit web app for viewing and managing [PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure) data. Reads and writes the same markdown files used by the PAI CLI skills — CRM, ERP, Projects, and Focus — so edits from the UI and the CLI are immediately in sync.

## Prerequisites

- [Bun](https://bun.sh) 1.x
- Node.js 18+ (adapter-node output runs under Node, not Bun)
- A PAI installation at `~/.claude` with the data directory unlocked (git-crypt)
- The PAI skills in `skills/` installed in `~/.claude/skills/`: CRM, ERP, Projects, DataLayer

## Setup

```bash
cd ~/Projets/pai-data-ui
bun install
cp .env.example .env   # set PAI_DATA_ROOT to your actual path
bun run dev
```

Opens at **http://localhost:5173**

## Environment

| Variable | Default | Description |
|---|---|---|
| `PAI_DATA_ROOT` | `~/.claude/PAI/USER/DATA` | Absolute path to your PAI DATA directory |
| `PORT` | `4173` (prod) / `5173` (dev) | HTTP port |
| `ORIGIN` | `http://localhost:$PORT` | Canonical origin for adapter-node CSRF protection |

## CLI Skills

This UI is the web counterpart to four PAI CLI skills. Both read and write the same markdown files.

### CRM (`skills/CRM/`)

Contact and opportunity management. Commands: `crm:add-contact`, `crm:pipeline`, `crm:follow-up`, `crm:search`.

Data: `DATA/CRM/contacts/`, `DATA/CRM/opportunities/`, `DATA/CRM/organizations/`

### ERP (`skills/ERP/`)

Invoice and financial management. Commands: `erp:invoice`, `erp:expense`, `erp:income`, `erp:budget`.

Data: `DATA/ERP/invoices/`, `DATA/ERP/expenses/`, `DATA/ERP/income/`, `DATA/ERP/payments/`, `DATA/ERP/exports/`

### Projects (`skills/Projects/`)

Project and task management. Commands: `projects:dashboard`, `projects:new`, `projects:task`, `projects:sync`, `projects:log-time`, `projects:promote`.

Data: `DATA/PM/projects/`, `DATA/PM/tasks/`, `DATA/PM/context/`

### DataLayer (`skills/DataLayer/`)

Domain scaffolding, schema management, and index rebuild. Commands: `data:new-domain`, `data:update-schema`, `data:rebuild-index`, `data:status`.

Data: `DATA/_index/pai.db` (SQLite FTS index, managed automatically)

## Features

### CRM

- Contacts list with status and tag filters and search
- Contact detail with editable fields and "Mark contacted today"
- Opportunity kanban (prospect, active, won/lost/on-hold)
- Organization list and detail

### ERP

- Invoice list with status filter and outstanding total
- Invoice detail with line items, totals, PDF export link, mark-paid action
- Invoice creation and editing
- Expense list (recurring and one-time) with category and scope filters
- Expense detail and editing
- Income list (ad-hoc income entries not tied to invoices)
- Stats dashboard: monthly revenue, committed vs actual expenses, savings rate, cash flow chart (12 months), expenses by category (pie chart), invoices by status

### PM

- Active project dashboard (mirrors `projects:dashboard` skill output)
- Project list grouped by type (client, ovn, r&d)
- Task kanban with drag-to-update status
- Task detail with time log history and append form
- Focus list — daily and weekly objectives with done/in-progress state
- "Prepare tomorrow / next week" flow with carry-or-drop ritual for unfinished items
- Unfinished item navigator for reviewing items across past lists
- "Promote opportunity to project" flow

### Global

- Sidebar search across all entity types (FTS5 full-text)
- Tags index — all entities with a given tag (`/tags/[tag]`)
- Root dashboard: follow-up needed (contacts >30 days), overdue invoices, blocked tasks

## Data

All data lives in `$PAI_DATA_ROOT` as markdown with YAML frontmatter. Markdown is the source of truth — the UI reads and writes files directly. A SQLite FTS index at `DATA/_index/pai.db` powers cross-entity search and is kept in sync by a chokidar file watcher that starts with the server.

```
DATA/
├── CRM/
│   ├── contacts/      contact-*.md
│   ├── opportunities/ opp-*.md
│   └── organizations/ org-*.md
├── ERP/
│   ├── invoices/      inv-*.md
│   ├── expenses/      exp-*.md
│   ├── income/        income-*.md
│   ├── payments/      pay-*.md
│   └── exports/       PDF exports (read-only in UI)
├── PM/
│   ├── projects/      proj-*.md
│   ├── tasks/         task-*.md
│   ├── focus/         focus-*.md
│   └── context/       freeform context files
└── _index/
    └── pai.db         SQLite FTS index (auto-managed, do not edit)
```

To force a full index rebuild: `bun rebuild-index`

## Tech Stack

- SvelteKit 2 + Svelte 5 (runes), adapter-node
- TypeScript 6, Bun runtime
- Tailwind CSS v4 (dark theme)
- Effect TS (typed error handling in data layer)
- gray-matter (frontmatter parse/write)
- better-sqlite3 (SQLite FTS index)
- chokidar (file watcher for real-time sync)
- CodeMirror 6 (markdown + YAML in-app editors)
- D3 (charts in ERP stats dashboard)
- PDFKit (invoice PDF generation and export)
- marked (markdown rendering)
- Biome (formatting)

## Production

### Build and run the binary

```bash
bun run build        # SvelteKit production build → build/
bun run build:binary # compile launcher → ./pai-data-ui binary
./pai-data-ui        # start the production server on port 4173
```

The binary wraps `scripts/launcher.ts`, which spawns Node to run the adapter-node output. The `better-sqlite3` native module requires Node — not Bun — at runtime.

### Systemd service (Linux, recommended)

```bash
bash scripts/install.sh
```

This script:

1. Builds the binary if not already built
2. Writes a systemd user service at `~/.config/systemd/user/pai-data-ui.service`
3. Writes a `.desktop` launcher at `~/.local/share/applications/pai-data-ui.desktop`
4. Enables the service to start automatically with your graphical session

```bash
systemctl --user start pai-data-ui    # start now
systemctl --user stop  pai-data-ui    # stop
systemctl --user status pai-data-ui   # check status
```

The service runs `scripts/tray.py` (requires Python with `pystray` + `Pillow`, fetched automatically via `uv`), which manages a system tray icon and starts the binary. The `.desktop` file calls `scripts/start.sh`, which starts the service and opens the browser.
