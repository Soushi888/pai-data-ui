---
name: DataLayer
description: PAI data layer authoring — scaffold new domains, update schemas, rebuild SQLite index, and inspect data health. USE WHEN data layer, datalayer, new domain, add domain, scaffold domain, update schema, add field, modify schema, rebuild index, sync index, refresh sqlite, data status, data health, domain status, data:new-domain, data:update-schema, data:rebuild-index, data:status.
argument-hint: [new-domain | update-schema | rebuild-index | status]
---

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/DataLayer/`

If this directory exists, load and apply any PREFERENCES.md, configurations, or resources found there. These override default behavior. If the directory does not exist, proceed with skill defaults.

## MANDATORY: Voice Notification (REQUIRED BEFORE ANY ACTION)

**You MUST send this notification BEFORE doing anything else when this skill is invoked.**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the DataLayer skill to ACTION", "voice_id": "OqTGHgPzbq47nVmGUnK2", "voice_enabled": true}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **DataLayer** skill...
   ```

**This is not optional. Execute this curl command immediately upon skill invocation.**

# DataLayer Skill

Meta-skill for authoring and evolving the PAI data layer at `$PAI_DATA_ROOT/`. Scaffolds new domains, updates schemas and templates, rebuilds the SQLite index, and reports domain health. This skill is about building the infrastructure — not using it (CRM, ERP, and Projects handle that).

## Data Location

> `$PAI_DATA_ROOT` is set via `.env` (default: `~/.claude/PAI/USER/DATA`).

```
$PAI_DATA_ROOT/
├── _schemas/          # JSON Schema definitions per entity type
├── _templates/        # Markdown templates for new entities
├── _index/            # SQLite index (pai.db — rebuilt from markdown files)
├── CRM/               # Contacts, opportunities, organizations
├── ERP/               # Invoices, exports
├── PM/                # Projects, tasks, context
└── Time/              # Time tracking (Phase 2 stub)
```

Rebuild script: `$PAI_DATA_ROOT/Tools/rebuild-index.ts`

## Workflow Routing

| Trigger | Workflow | Description |
|---------|----------|-------------|
| `data:new-domain`, `new domain`, `add domain`, `scaffold domain` | `Workflows/NewDomain.md` | Scaffold a new data domain end-to-end |
| `data:update-schema`, `update schema`, `add field`, `modify schema` | `Workflows/UpdateSchema.md` | Update an existing schema and sync its template |
| `data:rebuild-index`, `rebuild index`, `sync index`, `refresh sqlite` | `Workflows/RebuildIndex.md` | Rebuild SQLite index from all markdown files |
| `data:status`, `data layer status`, `data health`, `domain status` | `Workflows/Status.md` | Health-check view of all domains, schemas, templates, and index |

## Data Writing Rules

- **No emdashes** — use colons, commas, or parentheses instead. Applies to all generated files.
- **TitleCase for directories** — domain dirs use TitleCase (e.g., `CRM`, `ERP`, `PM`)
- **kebab-case for entity IDs** — file names and `id` frontmatter always match (`contact-tibi.md` has `id: "contact-tibi"`)

## Examples

- `data:status` — Print a health table of all domains, schema coverage, and index state
- `data:new-domain` — Interactive scaffold for a new domain (dir + schema + template + README update)
- `data:update-schema` — Add or modify a field in an existing schema, then sync the template
- `data:rebuild-index` — Run rebuild-index.ts and report row counts per table

## Notes for the Homunculus

- **Schema format:** JSON Schema draft-07, stored in `_schemas/{entity}.schema.json`
- **Template format:** Markdown with YAML frontmatter; body provides rich prose context
- **Always verify schema+template parity** after any schema change — frontmatter fields must mirror required schema fields
- **yq for frontmatter reads:** `~/go/bin/yq --front-matter=extract`
- **rg for full-text search:** `rg -il` (case-insensitive) or `rg -l` (file-level)
- **SQLite index is read-only for skills** — only rebuilt by rebuild-index.ts, never written directly
- **Schemas live at domain level** in `_schemas/`, not inside domain subdirs
- **When adding a new domain**, also scaffold the corresponding PAI skill via CreateSkill and add it to pai-data-ui
