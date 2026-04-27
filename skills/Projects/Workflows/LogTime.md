# LogTime Workflow

Add a time log entry to a specific task.

## MANDATORY: Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Logging time on a task in the Projects skill.", "voice_id": "OqTGHgPzbq47nVmGUnK2", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

## Steps

### 1. Identify Task

If a task id is provided in args, use it. Otherwise list in-progress tasks:

```bash
YQ="$HOME/go/bin/yq --front-matter=extract"
DATA="$PAI_DATA_ROOT/PM"
for f in "$DATA/tasks"/task-*.md; do
  [ -f "$f" ] || continue
  status=$($YQ '.status' "$f" 2>/dev/null)
  if [ "$status" = "in-progress" ]; then
    $YQ '{id: .id, title: .title, project_id: .project_id}' "$f" 2>/dev/null
  fi
done
```

Ask which task to log time on. If no in-progress tasks, list all tasks and ask.

### 2. Collect Entry Fields

Ask for:
- **date**: Work date — default to today's date (YYYY-MM-DD)
- **hours**: Hours worked (minimum 0.25 = 15 min; accept formats like `1.5`, `2`, `0.5`)
- **notes**: Brief description of what was done (optional)

### 3. Read Task File

Use the Read tool to load the task file at:
`$PAI_DATA_ROOT/PM/tasks/{task-id}.md`

### 4. Update Frontmatter

Use the Edit tool to:

1. Append a new entry to the `time_logs` array:
```yaml
  - date: "{YYYY-MM-DD}"
    hours: {N}
    notes: "{notes}"
```
   Omit the `notes` line if no notes were provided.

2. Update `updated` to today's date.

### 5. Compute Total Hours

Sum all `hours` values across the `time_logs` array to report the running total.

### 6. Confirm

```
Time logged on {task-id}:
  Date:         {date}
  Hours:        {hours}h
  Notes:        {notes}
  Total logged: {sum}h  (across {count} entries)
```
