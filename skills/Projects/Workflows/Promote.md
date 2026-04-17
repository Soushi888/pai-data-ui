# Promote Workflow

Promote an existing CRM opportunity to a project in the PM data layer.

The opportunity file is preserved intact. The project is a new entity with an `opportunity_ref` linking back.

## MANDATORY: Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Promoting an opportunity to a project in the Projects skill.", "voice_id": "fTtv3eikoepIosk8dTZ5", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

## Steps

### 1. Identify Opportunity

If an opportunity id is provided in args (e.g. `projects:promote opp-hrea-maintainership`), use it directly.

Otherwise, list available opportunities:
```bash
YQ="$HOME/go/bin/yq --front-matter=extract"
for f in "$HOME/.claude/PAI/USER/DATA/CRM/opportunities"/opp-*.md; do
  [ -f "$f" ] || continue
  $YQ '{id: .id, title: .title, status: .status}' "$f" 2>/dev/null
done
```
Ask which opportunity to promote.

### 2. Read Opportunity

```bash
$YQ '.' "$HOME/.claude/PAI/USER/DATA/CRM/opportunities/{opp-id}.md"
```

### 3. Derive Project ID

Strip `opp-` prefix and add `proj-`: `opp-hrea-maintainership` → `proj-hrea-maintainership`.

Check for conflicts in `DATA/PM/projects/`. If already exists, inform user and stop.

### 4. Ask for project_type

The opportunity schema has no `project_type`. Ask: `client`, `ovn`, or `r&d`?

### 5. Map Fields

| Opportunity field | Project field |
|-------------------|---------------|
| `title` | `title` |
| `organization` | `organization` |
| `contact` | first entry in `contacts` array |
| `related_contacts` | remaining entries in `contacts` array |
| `tags` | `tags` |
| `notes` | `notes` |
| (opportunity id) | `opportunity_ref` |

Set `status: "active"`, `type: "project"`, `external_refs: []`.
Set `created` and `updated` to today's date.

### 6. Write Project File

Write to `~/.claude/PAI/USER/DATA/PM/projects/{proj-id}.md`.

**Do NOT modify the opportunity file.**

### 7. Create Context Folder

```bash
mkdir -p "$HOME/.claude/PAI/USER/DATA/PM/context/{proj-id}"
```

### 8. Confirm

```
Opportunity promoted:
  Source:       DATA/CRM/opportunities/{opp-id}.md  (unchanged)
  Project:      DATA/PM/projects/{proj-id}.md  (created)
  opportunity_ref: {opp-id}
  Type: {project_type}
```
