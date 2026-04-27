# FollowUp Workflow

Find contacts not reached in 30+ days (or a custom number of days if specified).

## Steps

### 1. Determine Threshold

Default: 30 days. If the command includes a number (e.g. `crm:follow-up 14`), use that number instead.

Calculate the cutoff date:
```bash
CUTOFF=$(date -d "-{N} days" +%Y-%m-%d)
```

### 2. Scan All Contacts

For each `.md` file in `$PAI_DATA_ROOT/CRM/contacts/`:

```bash
~/go/bin/yq --front-matter=extract '.last_contact' $PAI_DATA_ROOT/CRM/contacts/{file}.md
```

Compare the `last_contact` date string against the cutoff:
- If `last_contact < cutoff` → contact qualifies for follow-up
- If `last_contact >= cutoff` → contact is recent

Sort results by `last_contact` ascending (oldest first).

### 3. For Qualifying Contacts, Extract Context

```bash
~/go/bin/yq --front-matter=extract '{name: .name, organization: .organization, role: .role, last_contact: .last_contact, status: .status}' $PAI_DATA_ROOT/CRM/contacts/{file}.md
```

### 4. Render Follow-Up List

```
## Follow-Up List — contacts not reached in {N}+ days (as of {today})

| Name | Org | Role | Last Contact | Days Ago |
|------|-----|------|-------------|----------|
| {name} | {org} | {role} | {last_contact} | {days} |
| ...   |

{count} contacts need follow-up.
```

If no contacts qualify: "All contacts reached within the last {N} days. 🎉"

### 5. Optional: Update last_contact After Follow-Up

If the user responds "done" or "contacted {name}":
- Ask which contacts were reached
- Update their `last_contact` field to today's date using Edit tool
- Confirm the update
