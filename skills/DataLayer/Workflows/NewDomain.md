# New Domain Workflow

Scaffold a new PAI data domain end-to-end: directory structure, JSON schemas, markdown templates, and README update.

## MANDATORY: Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the New Domain workflow in the DataLayer skill to scaffold a new data domain.", "voice_id": "OqTGHgPzbq47nVmGUnK2", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

---

## Step 1: Gather Domain Info

Ask the user:
1. **Domain name** — TitleCase directory name (e.g., `Learning`, `Finance`, `Health`)
2. **Entity types** — What kinds of records will this domain hold? (e.g., `entry`, `goal`, `metric`)
3. **Key fields per entity** — For each entity type, what required frontmatter fields does it need?
4. **ID naming prefix** — The kebab-case prefix for file IDs (e.g., `entry-`, `goal-`, `metric-`)

If the user provides partial info, ask follow-up questions before proceeding.

---

## Step 2: Create Directory Structure

```bash
DATA_ROOT="$PAI_DATA_ROOT"
DOMAIN="<DomainName>"

# Create domain dir and entity subdirectories
mkdir -p "$DATA_ROOT/$DOMAIN"

# For each entity type (e.g., entries, goals, metrics):
mkdir -p "$DATA_ROOT/$DOMAIN/<entity-plural>"
```

Example for a `Learning` domain with `entries` and `goals`:
```bash
mkdir -p "$PAI_DATA_ROOT/Learning/entries"
mkdir -p "$PAI_DATA_ROOT/Learning/goals"
```

---

## Step 3: Write JSON Schemas

For each entity type, create `$PAI_DATA_ROOT/_schemas/{entity}.schema.json`.

Use the existing schemas as reference:
- `$PAI_DATA_ROOT/_schemas/contact.schema.json` (simple entity, many optional fields)
- `$PAI_DATA_ROOT/_schemas/invoice.schema.json` (entity with nested arrays)
- `$PAI_DATA_ROOT/_schemas/project.schema.json` (entity with external refs)

**Schema template:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "EntityName",
  "type": "object",
  "required": ["id", "type", "title", "status", "tags", "created", "updated"],
  "properties": {
    "id":      { "type": "string", "description": "Matches filename without .md" },
    "type":    { "type": "string", "const": "<entity-type>" },
    "title":   { "type": "string" },
    "status":  { "type": "string", "enum": ["active", "archived"] },
    "tags":    { "type": "array", "items": { "type": "string" } },
    "created": { "type": "string", "format": "date" },
    "updated": { "type": "string", "format": "date" }
  },
  "additionalProperties": false
}
```

Adjust `required`, `properties`, and `enum` values based on the user's input from Step 1.

---

## Step 4: Write Markdown Templates

For each entity type, create `$PAI_DATA_ROOT/_templates/{entity}.md`.

**Template format:**
```markdown
---
id: "<prefix>-{{slug}}"
type: "<entity-type>"
title: ""
status: "active"
tags: []
created: "{{YYYY-MM-DD}}"
updated: "{{YYYY-MM-DD}}"
---

## Overview

<!-- Describe this record. -->

## Notes

<!-- Additional context, links, references. -->
```

Frontmatter fields must mirror all `required` fields from the schema (Step 3) plus key optional fields.

---

## Step 5: Update DATA README

Read `$PAI_DATA_ROOT/README.md` and add the new domain to:
1. The directory tree section
2. The entity type table (if one exists)
3. The ID naming conventions section

---

## Step 6: Report and Next Steps

Output a summary:
```
Domain created: <DomainName>
  Directory:  $PAI_DATA_ROOT/<DomainName>/
  Schemas:    _schemas/<entity1>.schema.json, _schemas/<entity2>.schema.json
  Templates:  _templates/<entity1>.md, _templates/<entity2>.md
  README:     updated

Next steps:
  1. Scaffold the PAI skill: /CreateSkill (name: <DomainName>, data path: $PAI_DATA_ROOT/<DomainName>/)
  2. Add the skill to pai-data-ui: copy skills/<DomainName>/ to /home/soushi888/Projets/pai-data-ui/skills/
  3. When ready: /DataLayer data:rebuild-index to include new domain in SQLite index
```
