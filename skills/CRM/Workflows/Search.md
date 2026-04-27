# Search Workflow

Full-text and frontmatter field search across all CRM entities.

## Steps

### 1. Parse the Query

Extract the search term from the command:
- `crm:search holochain` → query = "holochain"
- `crm:search status:active` → field filter: status = "active"
- `crm:search org:Sensorica` → field filter: organization contains "Sensorica"
- `crm:search tag:valueflows` → tag filter

### 2. Run the Search

**Full-text search** (default — searches body and frontmatter):
```bash
rg -il "{query}" $PAI_DATA_ROOT/CRM/
```

**Tag filter:**
```bash
rg -il "^\s*- {tag}" $PAI_DATA_ROOT/CRM/contacts/
```

**Status filter** (yq approach):
```bash
for f in $PAI_DATA_ROOT/CRM/contacts/*.md; do
  status=$(~/go/bin/yq --front-matter=extract '.status' "$f" 2>/dev/null)
  [ "$status" = "{value}" ] && echo "$f"
done
```

**Organization filter:**
```bash
rg -il "organization: .*{org}" $PAI_DATA_ROOT/CRM/contacts/
```

### 3. Extract Summary for Each Matching File

For each matching file, extract key fields:
```bash
~/go/bin/yq --front-matter=extract '{name: .name, organization: .organization, role: .role, status: .status, last_contact: .last_contact}' {file}
```

### 4. Render Results

```
## CRM Search: "{query}"

### Contacts ({count})
| Name | Org | Role | Status | Last Contact |
|------|-----|------|--------|-------------|
| {name} | {org} | {role} | {status} | {last_contact} |

### Opportunities ({count})
| Title | Contact | Status | Updated |
|-------|---------|--------|---------|
| ... |

{total} results found.
```

If no results: "No CRM entries match '{query}'."

### 5. Offer Follow-Up

If results found, offer:
> "Open a contact? Type the name or press Enter to skip:"
