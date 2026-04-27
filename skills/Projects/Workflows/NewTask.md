# NewTask Workflow

Create a new task and link it to an existing project.

## MANDATORY: Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Creating a new task in the Projects skill.", "voice_id": "OqTGHgPzbq47nVmGUnK2", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

## Steps

### 1. Identify Project

If a project id is provided in args, validate it exists:
```bash
ls "$PAI_DATA_ROOT/PM/projects/{proj-id}.md" 2>/dev/null
```

Otherwise list active projects:
```bash
YQ="$HOME/go/bin/yq --front-matter=extract"
DATA="$PAI_DATA_ROOT/PM"
for f in "$DATA/projects"/proj-*.md; do
  [ -f "$f" ] || continue
  $YQ '{id: .id, title: .title, status: .status}' "$f" 2>/dev/null
done
```
Ask which project this task belongs to.

### 2. Collect Task Fields

Ask for:

- **title** (required): Short task title
- **status** (required, default `todo`): `todo`, `in-progress`, `done`, or `blocked`
- **priority** (required, default `medium`): `low`, `medium`, `high`, or `critical`
- **t_shirt_size** (optional): `XS`, `S`, `M`, `L`, `XL`, or `XXL`
- **epic** (optional): Epic or milestone label string (e.g. "Phase 1 - Stabilization")
- **external_ref** (optional): URL to the external issue/MR/task (GitHub issue, GitLab MR, Tiki task)

### 3. Derive Task ID

Generate slug from title, prefix with `task-`.
Example: "Integrity zome validation" → `task-integrity-zome-validation`

Check for conflicts in `DATA/PM/tasks/`. If exists, append `-2`, `-3`.

### 4. Parse External Ref

If a URL was provided, detect system (`github`, `gitlab`, `tiki`, `other`) and extract the id (issue number, MR id, Tiki task id) from the URL path.

If no external ref, omit the field from the frontmatter entirely (do not write empty strings).

### 5. Write Task File

Copy from `$PAI_DATA_ROOT/_templates/task.md`.

Fill all fields. Set `time_logs: []`, `relations: []`, `tags: []`. Set `created` and `updated` to today.

Write to `$PAI_DATA_ROOT/PM/tasks/{id}.md`.

Omit optional fields (`t_shirt_size`, `epic`, `external_ref`) entirely if not provided, rather than writing empty placeholder values.

### 6. Confirm

```
Task created: {id}
  Project:  {project_id}
  Status:   {status}   Priority: {priority}   Size: {t_shirt_size}
  File:     DATA/PM/tasks/{id}.md
```
