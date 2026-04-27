# Rebuild Index Workflow

Rebuild the SQLite index at `$PAI_DATA_ROOT/_index/pai.db` from all markdown files across all domains.

## MANDATORY: Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the Rebuild Index workflow in the DataLayer skill to sync the SQLite index.", "voice_id": "OqTGHgPzbq47nVmGUnK2", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

---

## Step 1: Run the Rebuild Script

The rebuild script lives in the pai-data-ui project. Run it from the project root:

```bash
cd /path/to/pai-data-ui && bun scripts/rebuild-index.ts
```

Or via the npm script alias:

```bash
cd /path/to/pai-data-ui && bun run rebuild-index
```

The script reads `PAI_DATA_ROOT` from `.env` automatically (Bun loads `.env` from the working directory). It walks all `.md` files, upserts entities into SQLite, and removes stale rows for deleted files.

---

## Step 2: Verify

```bash
ls -lh $PAI_DATA_ROOT/_index/pai.db
```

If `sqlite3` is available, show row counts per entity type:

```bash
sqlite3 $PAI_DATA_ROOT/_index/pai.db \
  "SELECT type, domain, COUNT(*) as rows FROM entities GROUP BY type, domain ORDER BY domain, type;"
```

---

## Step 3: Report

```
Index rebuilt successfully.
  Database: $PAI_DATA_ROOT/_index/pai.db
  Size: <size>
  Entities indexed:
    contact: <N>
    opportunity: <N>
    organization: <N>
    invoice: <N>
    project: <N>
    task: <N>
```
