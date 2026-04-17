---
name: Projects
description: Personal project and task management for the PAI data layer. Track active projects across freelance, OVN, and R&D contexts. Manage tasks with status, time logging, T-shirt sizing, and external references to GitHub/GitLab/Tiki. Sync progress multiple times per day via Socratic dialogue, session extraction, or direct input. Promote CRM opportunities to projects. USE WHEN projects, my projects, active projects, project status, add task, new task, task update, log time, time log, sync work, sync progress, what am I working on, promote opportunity, new project, create project, project dashboard, projects:dashboard, projects:new, projects:task, projects:sync, projects:log-time, projects:promote.
argument-hint: [dashboard | new | task | sync | log-time | promote]
---

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/Projects/`

If this directory exists, load and apply any PREFERENCES.md, configurations, or resources found there. These override default behavior. If the directory does not exist, proceed with skill defaults.

## MANDATORY: Voice Notification (REQUIRED BEFORE ANY ACTION)

Fire a voice notification before any workflow execution:

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the WORKFLOWNAME workflow in the Projects skill to ACTION.", "voice_id": "fTtv3eikoepIosk8dTZ5", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

## Workflow Routing

| Trigger | Workflow | Description |
|---------|----------|-------------|
| `dashboard`, `status`, `what am I working on`, `projects:dashboard` | `Workflows/Dashboard.md` | All active projects with current task state |
| `new project`, `create project`, `projects:new` | `Workflows/NewProject.md` | Create a standalone project |
| `promote`, `opp to project`, `convert opportunity`, `projects:promote` | `Workflows/Promote.md` | Promote a CRM opportunity to a project |
| `add task`, `new task`, `create task`, `projects:task` | `Workflows/NewTask.md` | Add a task to an existing project |
| `sync`, `update progress`, `log progress`, `what did I work on`, `projects:sync` | `Workflows/Sync.md` | Update task statuses and log time (3 modes) |
| `log time`, `log hours`, `time spent`, `projects:log-time` | `Workflows/LogTime.md` | Quick time log entry on a specific task |

## Data Location

```
~/.claude/PAI/USER/DATA/PM/
  projects/     proj-{id}.md files
  tasks/        task-{id}.md files (flat, linked by project_id)
  context/      proj-{id}/ folders for session notes and PR summaries
```

Schemas: `~/.claude/PAI/USER/DATA/_schemas/project.schema.json`, `task.schema.json`
Templates: `~/.claude/PAI/USER/DATA/_templates/project.md`, `task.md`

## Key Rules

- **No em dashes** in any data file — use colon, comma, or parentheses instead
- **ID matches filename**: `proj-hrea.md` has `id: "proj-hrea"`
- **Soft references only**: `project_id`, `opportunity_ref`, contact refs are strings, not enforced FK
- **External systems are source of truth**: PAI is the personal view layer, never a mirror
- **yq for frontmatter reads**: `~/go/bin/yq --front-matter=extract`
- **rg for search**: `rg -il` for full-text, `rg -l` for file-level matches
