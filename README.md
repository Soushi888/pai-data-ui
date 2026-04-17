# PAI Data UI

Local SvelteKit web app for viewing and managing [PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure) data. Reads and writes the same markdown files used by the PAI CLI skills — CRM, ERP, and project management — so edits from the UI and the CLI are immediately in sync.

## Prerequisites

- [Bun](https://bun.sh) 1.x
- A PAI installation at `~/.claude` with the data directory unlocked (git-crypt)
- The three PAI skills in `skills/` installed in `~/.claude/skills/`: CRM, ERP, Projects

## Setup

```bash
cd ~/Projets/pai-data-ui
bun install
cp .env.example .env   # then set PAI_DATA_ROOT to your actual path
bun run dev
```

Opens at **http://localhost:5173**

## Environment

| Variable | Default | Description |
|---|---|---|
| `PAI_DATA_ROOT` | (required) | Absolute path to your PAI DATA directory, e.g. `/home/you/.claude/PAI/USER/DATA` |
| `PORT` | `5173` | Dev server port |

## CLI Skills

This UI is the web counterpart to three PAI CLI skills. Both read and write the same markdown files.

### CRM (`skills/CRM/`)

Contact and opportunity management. Skill commands: `crm:add-contact`, `crm:pipeline`, `crm:follow-up`, `crm:search`.

Data: `DATA/CRM/contacts/`, `DATA/CRM/opportunities/`, `DATA/CRM/organizations/`

### ERP (`skills/ERP/`)

Invoice and billing management. Skill commands: `erp:invoice`, `erp:invoice list`, `erp:invoice export`, `erp:invoice mark-paid`.

Data: `DATA/ERP/invoices/`, `DATA/ERP/exports/`

### Projects (`skills/Projects/`)

Project and task management. Skill commands: `projects:dashboard`, `projects:new`, `projects:task`, `projects:sync`, `projects:log-time`, `projects:promote`.

Data: `DATA/PM/projects/`, `DATA/PM/tasks/`, `DATA/PM/context/`

## Features

### CRM
- Contacts list with status and tag filters and search
- Contact detail with editable fields and "Mark contacted today"
- Opportunity kanban (prospect, active, won/lost/on-hold)
- Organization list and detail

### ERP
- Invoice list with status filter and outstanding total
- Invoice detail with line items, totals, mark-paid action
- PDF viewer link for invoices with existing exports

### PM
- Active project dashboard (mirrors `projects:dashboard` skill output)
- Project list grouped by type (client, ovn, r&d)
- Task kanban with drag-to-update status
- Task detail with time log history and append form
- "Promote opportunity to project" flow

### Global
- Sidebar search across all entity types
- Root dashboard: follow-up needed (>30 days), overdue invoices, blocked tasks

## Data

All data lives in `$PAI_DATA_ROOT` as markdown with YAML frontmatter. The UI reads and writes these files directly via [gray-matter](https://github.com/jonschlinkert/gray-matter). Edits from the CLI skills and the UI are immediately visible to each other — markdown is the source of truth.

```
DATA/
├── CRM/contacts/      contact-*.md
├── CRM/opportunities/ opp-*.md
├── CRM/organizations/ org-*.md
├── ERP/invoices/      inv-*.md
├── ERP/exports/       PDF exports (read-only in UI)
└── PM/
    ├── projects/      proj-*.md
    ├── tasks/         task-*.md
    └── context/       freeform context files
```

## Tech Stack

- SvelteKit 2 + Svelte 5 (runes), adapter-node
- Bun runtime
- Tailwind CSS v4 (dark theme)
- gray-matter (frontmatter parse/write)
- Effect TS (typed error handling)
- Biome (formatting)

## Production

```bash
bun run build
bun run start
```
