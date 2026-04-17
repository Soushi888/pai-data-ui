# AddContact Workflow

Create a new contact in the CRM from natural language input.

## Steps

### 1. Extract Contact Details

Parse the contact information from the command arguments. Extract:
- **Name** (required)
- **Organization** (optional, ask if not provided)
- **Role** (optional, ask if not provided)
- **Tags** (infer from context — organization type, relationship type, project)
- **Status** (default: "active")
- **last_contact** (default: today's date YYYY-MM-DD)
- **Email, GitHub, timezone** (optional — ask only if relevant)

If minimal information provided (e.g. "add Sam from hAppenings"), ask ONE follow-up:
> "Role and any tags? e.g. 'community manager, happenings, holochain' — press Enter to skip:"

### 2. Generate the ID

ID convention: `contact-{kebab-case-name}`

Examples:
- "Tibi" → `contact-tibi`
- "Marc Laporte" → `contact-marc-laporte`
- "Benoit Grégoire" → `contact-benoit-gregoire` (normalize accents: é→e)

Check for duplicates: `ls ~/.claude/PAI/USER/DATA/CRM/contacts/ | grep "{proposed-id}"`

If duplicate found, ask: "contact-{id}.md already exists. Overwrite or use a different id?"

### 3. Build the Frontmatter

```yaml
---
id: "contact-{id}"
type: "contact"
name: "{Name}"
organization: "{Organization}"
role: "{Role}"
tags:
  - {tag-one}
  - {tag-two}
status: "{status}"
last_contact: "{today-YYYY-MM-DD}"
created: "{today-YYYY-MM-DD}"
---
```

Optional fields (include only if provided):
- `email: "{email}"`
- `github: "{github}"`
- `timezone: "{timezone}"`

### 4. Write the File

Write to `~/.claude/PAI/USER/DATA/CRM/contacts/contact-{id}.md` using this structure:

```
{frontmatter block}

{Relationship context — one sentence summary from the natural language input}

## Notes

- {today-YYYY-MM-DD}: Contact created.
```

### 5. Verify

Run:
```bash
~/go/bin/yq --front-matter=extract '.name' ~/.claude/PAI/USER/DATA/CRM/contacts/contact-{id}.md
```

Must return the contact's name without error (exit 0).

### 6. Confirm

Output:
```
✅ Contact created: ~/.claude/PAI/USER/DATA/CRM/contacts/contact-{id}.md

Name: {Name}
Organization: {Organization}
Role: {Role}
Tags: {tag-one}, {tag-two}
Status: {status}
Last contact: {date}
```
