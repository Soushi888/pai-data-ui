# Update Schema Workflow

Update a field in an existing entity schema and keep its markdown template in sync.

## MANDATORY: Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the Update Schema workflow in the DataLayer skill to modify a schema and sync its template.", "voice_id": "OqTGHgPzbq47nVmGUnK2", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

---

## Step 1: Identify the Target

Ask the user:
1. **Which entity schema?** (e.g., `contact`, `invoice`, `project`, `task`)
2. **What change?**
   - Add a new field (required or optional)
   - Modify an existing field (type, enum values, description)
   - Remove a field (warn: may require data migration)

List available schemas if the user is unsure:
```bash
ls $PAI_DATA_ROOT/_schemas/
```

---

## Step 2: Read Current State

Read both the schema and its template before making any changes:

```bash
cat $PAI_DATA_ROOT/_schemas/<entity>.schema.json
cat $PAI_DATA_ROOT/_templates/<entity>.md
```

If the template file does not exist for this entity, note it and offer to create one after updating the schema.

---

## Step 3: Apply Schema Change

Edit `$PAI_DATA_ROOT/_schemas/<entity>.schema.json`:

**Adding a required field:**
```json
"required": ["id", "type", ..., "new_field"],
"properties": {
  ...
  "new_field": {
    "type": "string",
    "description": "Description of what this field holds"
  }
}
```

**Adding an optional field** — add to `properties` only, not to `required`.

**Modifying an existing field** — update the property definition in-place.

**Removing a field** — remove from both `required` (if present) and `properties`.

Maintain valid JSON Schema draft-07 format. Never break the `$schema`, `title`, `type` headers.

---

## Step 4: Sync the Template

Edit `$PAI_DATA_ROOT/_templates/<entity>.md` to mirror the schema change:

- **Added required field:** Add it to the YAML frontmatter with a placeholder value (e.g., `""`, `[]`, `"YYYY-MM-DD"`)
- **Added optional field:** Add it to the YAML frontmatter commented or with an empty default
- **Modified field:** Update the placeholder to reflect the new type or enum values
- **Removed field:** Remove it from the YAML frontmatter

The frontmatter field order should follow: required fields first (in schema order), then optional fields.

---

## Step 5: Migration Warning (if applicable)

If an existing field was **renamed**, **removed**, or had its **type changed** (e.g., string to array), check whether existing data files need updating:

```bash
# Count existing files that may be affected
ls $PAI_DATA_ROOT/<domain>/<entity-plural>/ | wc -l

# Check if existing files have the old field
~/go/bin/yq --front-matter=extract '.<old_field>' $PAI_DATA_ROOT/<domain>/<entity-plural>/*.md 2>/dev/null | grep -v "null" | head -5
```

If existing files are affected, warn the user:
```
WARNING: <N> existing <entity> files have the old field "<old_field>".
These files are NOT automatically migrated. To update them, run:
  data:rebuild-index  (after manual migration)

Manual migration required: update each file's frontmatter to replace
"<old_field>" with "<new_field>" before rebuilding the index.
```

Do NOT auto-migrate data files — that requires explicit user instruction.

---

## Step 6: Report

```
Schema updated: _schemas/<entity>.schema.json
  Change: <describe what changed>
  Template synced: _templates/<entity>.md

Migration required: <yes/no>
  Affected files: <N> existing <entity> records
  Action needed: <describe manual steps if yes>

Next steps:
  - Test with a new <entity> creation to verify the new field appears
  - Run data:rebuild-index when ready to update the SQLite index
```
