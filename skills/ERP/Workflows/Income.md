# Income Workflow

Record and list ad-hoc income: tax returns, grants, salaries, gifts, or any non-invoice income.

## Sub-command Routing

| Argument | Action |
|----------|--------|
| `create` or no argument with income context | Record a new income entry |
| `list` | List all income records chronologically |

---

## create — Record Ad-hoc Income

### 1. Gather Details

Extract from command arguments if provided. Otherwise prompt for:

- Name (required) — e.g. "Federal tax return 2025", "Quebec grant PROG-X"
- Category (required) — one of: `tax-return` | `grant` | `salary` | `gift` | `other`
- Scope (required) — `personal` | `freelance`
- Amount in CAD (required)
- Original currency if not CAD, and original amount
- Date received (required, YYYY-MM-DD)
- Tags (optional — infer from name/category)
- Notes (optional)

### 2. Generate ID

Pattern: `inc-{slug}-{year}`
- Slug = lowercase name, spaces to hyphens, special chars stripped
- Year = 4-digit year from date

Examples:
- "Federal tax return 2025" received 2026-04-15 → `inc-federal-tax-return-2025-2026`
- "Quebec grant" received 2026-03-01 → `inc-quebec-grant-2026`

Check for existing file:
```bash
ls $PAI_DATA_ROOT/ERP/income/inc-{slug}-{year}.md 2>/dev/null
```
If exists, ask to confirm overwrite or use a more specific name.

### 3. Write Income File

Path: `$PAI_DATA_ROOT/ERP/income/inc-{slug}-{year}.md`

```yaml
---
id: "inc-{slug}-{year}"
type: income
name: "{name}"
category: {category}
scope: {scope}
amount_cad: {amount_cad}
amount_original: {amount_original}
currency_original: {currency_original}
date: "{date}"
tags:
  - {tag}
notes: "{notes or omit}"
---
```

Omit `notes` when empty.

### 4. Verify

```bash
~/go/bin/yq --front-matter=extract '.id' $PAI_DATA_ROOT/ERP/income/{id}.md
```

### 5. Confirm

```
✅ Income recorded: inc-{slug}-{year}.md

Name:      {name}
Category:  {category}
Scope:     {scope}
Amount:    {amount_cad} CAD
Date:      {date}
```

---

## list — Income Pipeline

### 1. Scan

```bash
ls $PAI_DATA_ROOT/ERP/income/ 2>/dev/null
```

If empty: "No income records found. Record one with `erp:income create`."

### 2. Extract Fields

For each `.md` file:

```bash
~/go/bin/yq --front-matter=extract '{
  id: .id,
  name: .name,
  category: .category,
  scope: .scope,
  amount_cad: .amount_cad,
  currency_original: .currency_original,
  date: .date
}' $PAI_DATA_ROOT/ERP/income/{file}.md
```

### 3. Sort and Render

Sort by date descending. Group by year.

```
## Income Records — 2026-04-23

### 2026 (2)
| Date       | Name                    | Category   | Scope    | Amount      |
|------------|-------------------------|------------|----------|-------------|
| 2026-04-15 | Federal tax return 2025 | tax-return | personal | 1,240 CAD   |
| 2026-03-01 | Quebec grant PROG-X     | grant      | freelance| 5,000 CAD   |

### 2025 (1)
| Date       | Name              | Category | Scope    | Amount     |
|------------|-------------------|----------|----------|------------|
| 2025-12-15 | Year-end bonus    | salary   | personal | 2,000 CAD  |
```

### 4. Summary

```
Total: {n} records | YTD: {sum} CAD | All time: {sum} CAD
```
