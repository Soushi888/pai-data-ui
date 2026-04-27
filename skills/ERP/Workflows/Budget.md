# Budget Workflow

Financial overview aggregating invoices, expenses, income, and payments into a unified dashboard.

## Trigger

`erp:budget` | `budget` | `budget overview`

---

## Overview — Financial Dashboard

### 1. Load All Data Sources

Run these reads in parallel:

**Invoices (paid):**
```bash
for f in $PAI_DATA_ROOT/ERP/invoices/*.md; do
  ~/go/bin/yq --front-matter=extract '{status: .status, total: .total, paid_date: .paid_date}' "$f"
done
```

**Expenses (active):**
```bash
for f in $PAI_DATA_ROOT/ERP/expenses/*.md; do
  ~/go/bin/yq --front-matter=extract '{id: .id, name: .name, category: .category, recurrence: .recurrence, status: .status, amount_cad: .amount_cad, billing_day: .billing_day}' "$f"
done
```

**Income:**
```bash
for f in $PAI_DATA_ROOT/ERP/income/*.md; do
  ~/go/bin/yq --front-matter=extract '{amount_cad: .amount_cad, date: .date}' "$f"
done
```

**Payments:**
```bash
for f in $PAI_DATA_ROOT/ERP/payments/*.md; do
  ~/go/bin/yq --front-matter=extract '{expense_id: .expense_id, amount_cad: .amount_cad, date: .date}' "$f"
done
```

### 2. Compute Summary Values

**Monthly committed** = sum of `amount_cad` for expenses where `status == "active"` AND `recurrence == "monthly"`

**Actual this month** = sum of `amount_cad` for payments where `date` starts with current `YYYY-MM`

**Income this month** = sum of:
- invoices where `status == "paid"` AND `paid_date` starts with current `YYYY-MM` (`.total`)
- income records where `date` starts with current `YYYY-MM` (`.amount_cad`)

**Net balance** = income this month - actual this month

### 3. Compute Monthly History (last 12 months)

For each of the last 12 months (YYYY-MM format):

- **Income by month:** sum invoice totals (paid_date) + income amounts (date)
- **Expenses by month:** sum payment amounts (date)

### 4. Compute Upcoming (next 6 months)

Annual expenses where `next_due` falls within the next 6 months from today.
One-time expenses where `status == "planned"` AND `next_due` falls within the next 6 months.

Sort by `next_due` ascending.

### 5. Render Dashboard

```
## Budget Overview — {today}

### Summary

Monthly Committed    Actual This Month    Income This Month    Net Balance
{n} CAD              {n} CAD              {n} CAD              +/-{n} CAD

### Monthly History — Last 12 Months

Month      Income      Expenses     Net
──────────────────────────────────────
2026-04    3,800       2,285        +1,515
2026-03    2,100       2,340        -240
2026-02    4,500       2,100        +2,400
...

### Expense Breakdown by Category (active monthly, annualized)

Category        Monthly     Annual
──────────────────────────────────
housing         1,050       12,600
subscriptions     215        2,580
utilities          65          780
other              10          120
──────────────────────────────────
Total           1,340       16,080

### Upcoming Payments (next 6 months)

Date         Expense          Category        Amount
────────────────────────────────────────────────────
2026-05-01   Rent             housing         1,050 CAD
2026-06-12   Annual domain    subscriptions      25 CAD
2026-07-01   New laptop       other           2,500 CAD
```

### 6. Footer

```
Sources: {n_invoices} paid invoices | {n_expenses} expense definitions | {n_income} income records | {n_payments} payment records
```

---

## Notes

- Budget is a read-only aggregation view. To add data, use `erp:expense`, `erp:income`, or `erp:expense record-payment`.
- The full interactive dashboard with D3 charts lives in pai-data-ui at `/erp/budget`.
- Currency note: USD amounts are shown as-is with currency label; no FX conversion is applied in the CLI view.
