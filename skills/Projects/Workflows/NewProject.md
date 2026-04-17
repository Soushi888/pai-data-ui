# NewProject Workflow

Create a new project in the PAI PM data layer through conversational input.

## MANDATORY: Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Creating a new project in the Projects skill.", "voice_id": "fTtv3eikoepIosk8dTZ5", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

## Steps

### 1. Collect Fields

If not provided in invocation args, ask for:

- **title** (required): Short descriptive project title
- **project_type** (required): `client` (billable freelance), `ovn` (open value network contribution), or `r&d` (personal/open-source research)
- **organization** (optional): Associated organization name
- **contacts** (optional): Space or comma-separated contact ids (e.g. `contact-lyn, contact-tibi`)
- **external_refs** (optional): One or more external project space URLs (GitHub repo, GitLab project, Tiki tracker)
- **tags** (optional): Comma-separated lowercase tags
- **notes** (optional): Brief inline notes

### 2. Derive ID

Generate a slug from the title:
- Lowercase, hyphens for spaces, remove special characters
- Prefix with `proj-`
- Example: "hREA Maintainership" → `proj-hrea-maintainership`

Check for conflicts:
```bash
ls "$HOME/.claude/PAI/USER/DATA/PM/projects/proj-{slug}.md" 2>/dev/null
```
If exists, append `-2`, `-3`, etc.

### 3. Parse External Refs

For each URL provided, detect system:
- `github.com` → system: `github`
- `gitlab.com` or any GitLab instance → system: `gitlab`
- Any Tiki URL → system: `tiki`
- Other → system: `other`

Extract the repo/project id from the URL path (e.g. `soushi888/nondominium` from `https://github.com/soushi888/nondominium`).

### 4. Write Project File

Copy the template from `~/.claude/PAI/USER/DATA/_templates/project.md`.

Fill in all collected fields. Set `created` and `updated` to today's date (YYYY-MM-DD).

Write to `~/.claude/PAI/USER/DATA/PM/projects/{id}.md`.

### 5. Create Context Folder

```bash
mkdir -p "$HOME/.claude/PAI/USER/DATA/PM/context/{id}"
```

### 6. Confirm

```
Project created: {id}
  Title:   {title}
  Type:    {project_type}
  File:    DATA/PM/projects/{id}.md
  Context: DATA/PM/context/{id}/
```
