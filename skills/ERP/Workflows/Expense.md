# Expense Workflow

Create expense definitions, list expenses, and record actual payments.

## Sub-command Routing

| Argument | Action |
|----------|--------|
| `create` or no argument with expense context | Create a new expense definition |
| `list` | List all expenses grouped by status |
| `record-payment {id}` | Record an actual payment for an expense |

---

## create — New Expense Definition

### 1. Gather Details

Extract from command arguments if provided. Otherwise prompt for:

**Core fields:**
- Name (required) — human label, e.g. "Rent", "Internet", "Claude Max"
- Category (required) — one of: `housing` | `utilities` | `subscriptions` | `transport` | `food` | `health` | `other`
- Scope (required) — `personal` | `freelance` | `mixed`
- Recurrence (required) — `monthly` | `annual` | `one-time`
- Amount in CAD (required)
- Original currency if not CAD — then also ask for original amount

**Recurrence-specific:**
- If `monthly`: billing day of month (1–31)
- If `annual` or `one-time`: next due date (ISO YYYY-MM-DD)

**Optional:**
- Start date (default: today)
- End date (only if known)
- Tags (infer from name/category if obvious)
- Notes

### 2. Generate ID

Slug = lowercase name with spaces replaced by hyphens, special chars stripped.
Example: "Claude Max" → `exp-claude-max`, "Rent" → `exp-rent`

Check for existing file:
```bash
ls $PAI_DATA_ROOT/ERP/expenses/exp-{slug}.md 2>/dev/null
```
If exists, abort with: "Expense `exp-{slug}` already exists. Use a more specific name or update the existing file."

### 3. Set Initial Status

- `monthly` or `annual` → `active`
- `one-time` → `planned`

### 4. Write the Expense File

Path: `$PAI_DATA_ROOT/ERP/expenses/exp-{slug}.md`

```yaml
---
id: "exp-{slug}"
type: expense
name: "{name}"
category: {category}
scope: {scope}
recurrence: {recurrence}
status: {status}
amount_cad: {amount_cad}
amount_original: {amount_original}
currency_original: {currency_original}
billing_day: {billing_day or omit}
next_due: "{next_due or omit}"
start_date: "{start_date}"
end_date: {end_date or omit}
tags:
  - {tag}
notes: "{notes or omit}"
---

## Notes

{any context prose, or leave empty}
```

Omit `billing_day`, `next_due`, `end_date`, `notes` when not applicable.

### 5. Verify

```bash
~/go/bin/yq --front-matter=extract '.id' $PAI_DATA_ROOT/ERP/expenses/exp-{slug}.md
```

Must return `"exp-{slug}"` without error.

### 6. Confirm

```
✅ Expense created: exp-{slug}.md

Name:         {name}
Category:     {category}
Scope:        {scope}
Recurrence:   {recurrence}
Amount:       {amount_cad} CAD
Status:       {status}
Start date:   {start_date}
{Billing day: {billing_day} / Next due: {next_due}}
```

---

## list — Expense Pipeline

### 1. Scan

```bash
ls $PAI_DATA_ROOT/ERP/expenses/ 2>/dev/null
```

If empty: "No expenses found. Create one with `erp:expense create`."

### 2. Extract Fields

For each `.md` file:

```bash
~/go/bin/yq --front-matter=extract '{
  id: .id,
  name: .name,
  category: .category,
  recurrence: .recurrence,
  status: .status,
  amount_cad: .amount_cad,
  currency_original: .currency_original,
  billing_day: .billing_day,
  next_due: .next_due
}' $PAI_DATA_ROOT/ERP/expenses/{file}.md
```

### 3. Compute Monthly Committed

Sum `amount_cad` for all expenses where `status == "active"` and `recurrence == "monthly"`.

### 4. Render

Group by status order: active → planned → cancelled

```
## Expenses — 2026-04-23

Monthly committed: $2,340 CAD

### Active (4)
| Name           | Category      | Recurrence | Amount     | Billing Day / Next Due |
|----------------|---------------|------------|------------|------------------------|
| Rent           | housing       | monthly    | 1050 CAD   | Day 1                  |
| Internet       | utilities     | monthly    | 65 CAD     | Day 3                  |
| Claude Max     | subscriptions | monthly    | 27 USD     | Day 15                 |
| Annual domain  | subscriptions | annual     | 25 CAD     | 2026-06-12             |

### Planned (1)
| Name       | Category | Recurrence | Amount    | Due        |
|------------|----------|------------|-----------|------------|
| New laptop | other    | one-time   | 2500 CAD  | 2026-07-01 |
```

### 5. Summary

```
Total: {n} expenses | Monthly committed: {sum} CAD
```

---

## record-payment — Log Actual Payment

### 1. Validate Expense Exists

```bash
~/go/bin/yq --front-matter=extract '{name: .name, amount_cad: .amount_cad, recurrence: .recurrence}' \
  $PAI_DATA_ROOT/ERP/expenses/{id}.md
```

If file not found: "Expense `{id}` not found."

### 2. Gather Payment Details

- Date (default: today, YYYY-MM-DD)
- Amount in CAD (default: expense `amount_cad` — press Enter to accept)
- Original currency if not CAD, and original amount
- Notes (optional)

### 3. Generate Payment ID

- Monthly: `pay-{expense-slug}-{YYYY-MM}` (from payment date)
- Annual or one-time: `pay-{expense-slug}-{YYYY-MM-DD}` (from payment date)

Check for existing payment:
```bash
ls $PAI_DATA_ROOT/ERP/payments/{payment-id}.md 2>/dev/null
```
If exists: "A payment for {id} in {YYYY-MM} already exists (`{payment-id}`). Record another? (y/N)"

### 4. Write Payment File

Path: `$PAI_DATA_ROOT/ERP/payments/{payment-id}.md`

```yaml
---
id: "{payment-id}"
type: payment
expense_id: "{expense-id}"
date: "{date}"
amount_cad: {amount_cad}
amount_original: {amount_original}
currency_original: {currency_original}
notes: "{notes or omit}"
tags: []
---
```

Omit `notes` when empty.

### 5. Verify

```bash
~/go/bin/yq --front-matter=extract '.expense_id' $PAI_DATA_ROOT/ERP/payments/{payment-id}.md
```

### 6. Confirm

```
✅ Payment recorded: {payment-id}.md

Expense:  {expense name}
Date:     {date}
Amount:   {amount_cad} CAD
{Diff:    +/- {diff} from expected {expense.amount_cad} CAD}
```

Show diff only when actual amount differs from expected.
