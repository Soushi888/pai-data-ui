---
name: CRM
description: Contact and opportunity management for PAI data layer. Manage contacts, track opportunities, follow up on relationships, and search the CRM. USE WHEN crm, add contact, new contact, crm:add-contact, pipeline, opportunities, follow-up, crm:follow-up, crm:pipeline, crm:search, search contacts, find contact, contact list.
argument-hint: [add-contact | pipeline | follow-up | search]
---

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/CRM/`

If this directory exists, load and apply any PREFERENCES.md, configurations, or resources found there. These override default behavior. If the directory does not exist, proceed with skill defaults.

## 🚨 MANDATORY: Voice Notification (REQUIRED BEFORE ANY ACTION)

**You MUST send this notification BEFORE doing anything else when this skill is invoked.**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the CRM skill to ACTION", "voice_id": "fTtv3eikoepIosk8dTZ5", "voice_enabled": true}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **CRM** skill...
   ```

**This is not optional. Execute this curl command immediately upon skill invocation.**

# CRM Skill

Contact and opportunity management via the PAI data layer at `~/.claude/PAI/USER/DATA/CRM/`. Contacts, opportunities, and organizations are markdown files with YAML frontmatter. All queries use `~/go/bin/yq` with the `--front-matter=extract` flag.

## Data Location

```
~/.claude/PAI/USER/DATA/CRM/
├── contacts/          # contact-*.md files
├── opportunities/     # opp-*.md files
├── organizations/     # org-*.md files
└── context/           # rich context assets (analyses, PDFs, notes)
    ├── opp-{id}/      # assets scoped to an opportunity
    └── contact-{id}/  # assets scoped to a contact
```

## Workflow Routing

| Trigger | Workflow | Description |
|---------|----------|-------------|
| `crm:add-contact`, `add contact`, `new contact` | `Workflows/AddContact.md` | Create a new contact from natural language |
| `crm:pipeline`, `pipeline`, `opportunities` | `Workflows/Pipeline.md` | List opportunities by status |
| `crm:follow-up`, `follow up`, `who to contact` | `Workflows/FollowUp.md` | Find contacts not contacted in 30+ days |
| `crm:search`, `find contact`, `search contacts` | `Workflows/Search.md` | Full-text and frontmatter search |

## Data Writing Rules

- **No emdashes**: use colons, commas, or parentheses instead. Applies to all CRM data files.

## Examples

- `crm:add-contact Tibi from Sensorica, Holochain developer` — Creates contact-tibi.md from natural language
- `crm:pipeline` — Lists all opportunities grouped by status
- `crm:follow-up` — Shows contacts where last_contact is 30+ days ago
- `crm:search holochain` — Returns all contacts/opportunities tagged with or mentioning holochain

## Schemas

All entity types are defined in `~/.claude/PAI/USER/DATA/_schemas/`. Templates are in `~/.claude/PAI/USER/DATA/_templates/`.

## Notes for the Homunculus

- **One entity = one file.** Never combine two people into one contact file.
- **Frontmatter is the index.** Body prose provides context; frontmatter enables querying.
- **Always use `--front-matter=extract`** with yq on .md files to avoid markdown body parse errors.
- **id matches filename.** contact-tibi.md has `id: "contact-tibi"`.
- **Context assets go in `context/{entity-id}/`** — not in the root context folder. Use `opp-{id}/` for opportunity assets, `contact-{id}/` for contact assets. Reference them in the parent entity's `context_assets` frontmatter field.
- **Context assets can be any file type** — markdown analyses, PDFs, email exports, notes. The `context_assets` field in the opportunity/contact frontmatter lists their paths.
- **Invoices are managed by the ERP skill** — use `erp:invoice` for invoice operations.
