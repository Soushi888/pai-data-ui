# Pipeline Workflow

List opportunities grouped by pipeline status.

## Steps

### 1. Scan Opportunity Files

```bash
ls $PAI_DATA_ROOT/CRM/opportunities/
```

If directory is empty: "No opportunities found. Use `crm:add-contact` and then create opportunities manually in `$PAI_DATA_ROOT/CRM/opportunities/`."

### 2. Extract Status for Each File

For each `.md` file in the opportunities directory:
```bash
~/go/bin/yq --front-matter=extract '.status' $PAI_DATA_ROOT/CRM/opportunities/{file}.md
```

Group files by status bucket: `prospect`, `active`, `won`, `lost`, `on-hold`

### 3. For Each Opportunity Extract Key Fields

```bash
~/go/bin/yq --front-matter=extract '{title: .title, contact: .contact, organization: .organization, value_cad: .value_cad, updated: .updated}' $PAI_DATA_ROOT/CRM/opportunities/{file}.md
```

### 4. Render Pipeline View

```
## Pipeline — {today-YYYY-MM-DD}

### Active ({count})
| Title | Contact | Org | Value (CAD) | Updated |
|-------|---------|-----|-------------|---------|
| {title} | {contact} | {org} | {value} | {updated} |

### Prospect ({count})
| ... |

### On Hold ({count})
| ... |

### Won ({count}) / Lost ({count})
| ... |
```

If a status bucket is empty, skip that section.

### 5. Summary Line

```
Total: {n} opportunities ({active} active, {prospect} prospect, {on-hold} on-hold, {won} won, {lost} lost)
```
