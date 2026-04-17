# Dashboard Workflow

Display all active and on-hold projects with their current task state.

## MANDATORY: Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the Dashboard workflow in the Projects skill.", "voice_id": "fTtv3eikoepIosk8dTZ5", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

## Steps

### 1. Read All Projects

```bash
YQ="$HOME/go/bin/yq --front-matter=extract"
DATA="$HOME/.claude/PAI/USER/DATA/PM"
for f in "$DATA/projects"/proj-*.md; do
  [ -f "$f" ] || continue
  $YQ '{id: .id, title: .title, project_type: .project_type, status: .status, organization: .organization}' "$f" 2>/dev/null
done
```

If no project files exist, output:

```
No projects yet. Use `/Projects new` to create your first project.
```

### 2. Read All Tasks

```bash
for f in "$DATA/tasks"/task-*.md; do
  [ -f "$f" ] || continue
  $YQ '{id: .id, project_id: .project_id, title: .title, status: .status, priority: .priority, t_shirt_size: .t_shirt_size, epic: .epic, external_ref: .external_ref}' "$f" 2>/dev/null
done
```

### 3. Render Dashboard

Group tasks by `project_id`. Filter to projects with status `active` or `on-hold`.

For each project, show tasks with status `in-progress` or `blocked` by default. If `--all` is in args, show all tasks regardless of status.

**Output format:**

```
Active Projects (N)
──────────────────────────────────────────────────────
proj-hrea-maintainership   [ovn]    hREA / ValueFlows Community
  ● in-progress   task-hrea-integrity-zomes          M   Phase 1
  ⚠ blocked       task-hrea-graphql-deprecation       L

proj-evoludata-tiki-r25    [client] EvoluData
  ● in-progress   task-evoludata-listresults-svc      S

On Hold (N)
──────────────────────────────────────────────────────
proj-nondominium-r25       [ovn]    Nondominium
  (no active tasks)

Completed / Archived — use `--all-status` to show
```

Status indicators: `●` in-progress, `⚠` blocked, `○` todo, `✓` done.

Show `(no tasks)` for projects with no in-progress or blocked tasks.

Show task `epic` value in brackets if set (e.g. `[Phase 1]`).

Show `external_ref.id` in grey if present (e.g. `#42`).
