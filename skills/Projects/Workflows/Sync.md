# Sync Workflow

Update task statuses and log time. Three input modes auto-detected from context.

## MANDATORY: Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the Sync workflow in the Projects skill.", "voice_id": "OqTGHgPzbq47nVmGUnK2", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

## Mode Detection

Inspect the invocation args and context to select mode:

- **Session extraction**: args contain a URL (GitHub PR, GitLab MR, Tiki task) or a substantial block of pasted text (3+ lines)
- **Direct**: args contain inline status/time statements (e.g. `task-foo done`, `task-bar in-progress 2h`)
- **Socratic** (default): no significant args, or just a project id or keyword

---

## Mode 1: Socratic (default)

### Step 1: Load Current State

```bash
YQ="$HOME/go/bin/yq --front-matter=extract"
DATA="$PAI_DATA_ROOT/PM"
for f in "$DATA/projects"/proj-*.md; do
  [ -f "$f" ] || continue
  $YQ '{id: .id, title: .title, status: .status}' "$f" 2>/dev/null
done
for f in "$DATA/tasks"/task-*.md; do
  [ -f "$f" ] || continue
  $YQ '{id: .id, project_id: .project_id, title: .title, status: .status}' "$f" 2>/dev/null
done
TODAY=$(date +%Y-%m-%d)
FOCUS_FILE="$DATA/focus/focus-daily-$TODAY.md"
if [ -f "$FOCUS_FILE" ]; then
  $YQ '{items: .items}' "$FOCUS_FILE" 2>/dev/null
fi
```

Show current in-progress and blocked tasks grouped by project.

### Step 2: Ask What Was Worked On

If today's focus list exists and has items with `linked_ref` matching known PM task IDs, surface them as context before asking:

```
Today's focus had these task-linked items:
  ○ item-2   Review Tiki PR #157           -> task-tiki-pr157
  ○ item-3   Investigate PAI memory leak   -> task-pai-memleak

What did you work on?
```

If no linked items exist, ask the plain question: "What did you work on?"

If user mentions a project by name or topic, focus that project's tasks. If vague, show in-progress tasks across all active projects and ask which ones moved.

### Step 3: For Each Identified Task

For each task mentioned, ask:
1. Did the status change? (current: `{status}` → new status?)
2. How much time did you spend? (e.g. 1.5h)
3. Any notes on what was done?

### Step 4: Propose Changes

Present a summary before writing:
```
Proposed updates:
  task-hrea-integrity-zomes: in-progress → done, +2h (2026-04-17, "completed all entry types")
  task-hrea-graphql-deprecation: todo → in-progress, +0.5h (2026-04-17, "started deprecation doc")
```

Wait for confirmation before writing.

### Step 5: Apply Updates

For each confirmed task, use Read + Edit to:
1. Update `status` in frontmatter
2. Append entry to `time_logs` array: `{date: "YYYY-MM-DD", hours: N, notes: "..."}`
3. Update `updated` to today

After marking a task `done`, check today's focus list for any item where `linked_ref` matches that task id and `done: false`. If found, ask:

```
Focus item "item-2: Review Tiki PR #157" is linked to this task. Mark it done too? [y/N]
```

If confirmed, use Read + Edit to set `done: true` on that item and update the focus file's `updated` field.

---

## Mode 2: Session Extraction

### Step 1: Parse Input

If a URL is provided, use WebFetch to retrieve the PR/issue/MR content. If pasted text, use directly.

### Step 2: Extract Task References

Identify from content:
- Task IDs mentioned directly (`task-{slug}`)
- Project names or topic keywords that map to known projects/tasks
- Work completed (past tense: "merged", "fixed", "closed", "resolved", "done")
- Time indicators ("spent 2h", "~30 min", "1.5 hours")
- Status changes (PR merged = task potentially done, issue closed = done)

Cross-reference with existing task files via `rg` to find matches.

### Step 3: Propose Updates

Same format as Socratic Step 4. Wait for confirmation before writing.

### Step 4: Apply Updates

Same as Socratic Step 5.

---

## Mode 3: Direct

### Step 1: Parse Inline Statements

Parse patterns like:
- `task-{id} done` or `task-{id} is done` → `status: done`
- `task-{id} in-progress` → `status: in-progress`
- `task-{id} blocked` → `status: blocked`
- `task-{id} 2h` or `2h on task-{id}` or `task-{id}: 2h` → add time log entry
- Combined: `task-{id} done 2h "fixed the zome"` → status + time + note

If task id is not recognized, list similar tasks and ask for clarification.

### Step 2: Apply Immediately

No confirmation step. Apply each update and report:
```
Updated task-hrea-integrity-zomes: status → done
Logged 2h on task-hrea-integrity-zomes (2026-04-17)
```
