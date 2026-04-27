# Status Workflow

Health-check view of the full PAI data layer: domains, entity counts, schema coverage, template coverage, and index state.

## MANDATORY: Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the Status workflow in the DataLayer skill to report data layer health.", "voice_id": "OqTGHgPzbq47nVmGUnK2", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

---

## Step 1: Discover Domains

```bash
DATA_ROOT="$PAI_DATA_ROOT"

# List all domain directories (exclude meta dirs)
ls -d "$DATA_ROOT"/*/  | grep -v '_schemas\|_templates\|_index\|Time' | xargs -I{} basename {}
```

---

## Step 2: Count Entities per Domain

For each domain, count the markdown files in each subdirectory:

```bash
# Example for CRM
find "$DATA_ROOT/CRM" -name "*.md" | wc -l
find "$DATA_ROOT/CRM/contacts" -name "*.md" 2>/dev/null | wc -l
find "$DATA_ROOT/CRM/opportunities" -name "*.md" 2>/dev/null | wc -l
find "$DATA_ROOT/CRM/organizations" -name "*.md" 2>/dev/null | wc -l

# Example for ERP
find "$DATA_ROOT/ERP/invoices" -name "*.md" 2>/dev/null | wc -l

# Example for PM
find "$DATA_ROOT/PM/projects" -name "*.md" 2>/dev/null | wc -l
find "$DATA_ROOT/PM/tasks" -name "*.md" 2>/dev/null | wc -l
```

---

## Step 3: Inventory Schemas and Templates

```bash
echo "=== Schemas ==="
ls "$DATA_ROOT/_schemas/"

echo "=== Templates ==="
ls "$DATA_ROOT/_templates/"
```

Cross-reference: for each entity type found via schemas, verify a matching template exists and vice versa.

---

## Step 4: Check Index and Rebuild Script

```bash
# Index database
ls -lh "$DATA_ROOT/_index/pai.db" 2>/dev/null || echo "NOT FOUND"

# Rebuild script
ls -la "$DATA_ROOT/Tools/rebuild-index.ts" 2>/dev/null || echo "NOT FOUND (Phase 2 pending)"
```

If `sqlite3` is available and the database exists, run a quick row count:
```bash
sqlite3 "$DATA_ROOT/_index/pai.db" \
  "SELECT type, COUNT(*) as n FROM entities GROUP BY type ORDER BY n DESC;" 2>/dev/null
```

---

## Step 5: Output Health Table

Format the output as a concise status report:

```
PAI Data Layer — Status Report
Generated: <YYYY-MM-DD HH:MM>

DOMAINS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Domain   │ Entities                              │ Status
─────────┼───────────────────────────────────────┼────────
CRM      │ 14 contacts, 5 opps, 2 orgs           │ active
ERP      │ 7 invoices                            │ active
PM       │ 1 project, 0 tasks                    │ bootstrapped
Time     │ (stub — Phase 2 pending)              │ pending
─────────┴───────────────────────────────────────┴────────

SCHEMAS & TEMPLATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Entity        │ Schema │ Template │ Notes
──────────────┼────────┼──────────┼───────────
contact       │  ✓     │  ✓       │
opportunity   │  ✓     │  ✓       │
organization  │  ✓     │  ✓       │
invoice       │  ✓     │  ✓       │
project       │  ✓     │  ✓       │
task          │  ✓     │  ✓       │
──────────────┴────────┴──────────┴───────────

INDEX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Database:       <path> (<size>) or NOT FOUND
Rebuild script: EXISTS or NOT FOUND (Phase 2 pending)
Last rebuild:   <mtime of pai.db> or unknown

ACTIONS AVAILABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  data:new-domain     — scaffold a new domain
  data:update-schema  — modify a schema and sync its template
  data:rebuild-index  — rebuild the SQLite index
```

Adjust the table to reflect actual counts from Steps 1-4. Mark any missing schema/template pair with `✗` and a note.
