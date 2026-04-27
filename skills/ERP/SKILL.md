---
name: ERP
description: Invoice, expense, income, and budget management for PAI data layer. Create invoices, track recurring/one-time expenses, record ad-hoc income, view budget overview. USE WHEN erp, invoice, expense, income, budget, erp:invoice, erp:expense, erp:income, erp:budget, create invoice, generate invoice, export invoice, mark paid, invoice list, billing, invoicing, add expense, expense list, record payment, income list, budget overview.
argument-hint: [invoice | invoice:create | invoice:list | invoice:export | invoice:mark-paid | expense | expense:create | expense:list | expense:record-payment | income | income:create | income:list | budget]
category: domain
feeds-into: []
mcp-deps: []
---

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/ERP/`

If this directory exists, load and apply any PREFERENCES.md, configurations, or resources found there. These override default behavior. If the directory does not exist, proceed with skill defaults.

## MANDATORY: Voice Notification (REQUIRED BEFORE ANY ACTION)

**You MUST send this notification BEFORE doing anything else when this skill is invoked.**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the ERP skill to ACTION", "voice_id": "OqTGHgPzbq47nVmGUnK2", "voice_enabled": true}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **ERP** skill...
   ```

**This is not optional. Execute this curl command immediately upon skill invocation.**

# ERP Skill

Full financial management via the PAI data layer at `$PAI_DATA_ROOT/ERP/`. All entities are markdown files with YAML frontmatter. All queries use `~/go/bin/yq` with the `--front-matter=extract` flag.

## Data Location

> `$PAI_DATA_ROOT` is set via `.env` (default: `~/.claude/PAI/USER/DATA`).

```
$PAI_DATA_ROOT/ERP/
├── invoices/          # inv-YYYYMM-NNNN.md files
├── expenses/          # exp-{slug}.md — one file per expense definition
├── income/            # inc-{slug}-{year}.md — ad-hoc income records
├── payments/          # pay-{expense-slug}-{YYYY-MM}.md — actual payment records
└── exports/
    └── invoices/      # PDF exports (one subfolder per invoice id)
        └── {id}/
```

Sender billing config: `~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/ERP/InvoiceConfig.md`

## Workflow Routing

| Trigger | Workflow | Description |
|---------|----------|-------------|
| `erp:invoice`, `invoice`, `create invoice`, `generate invoice`, `erp:invoice create` | `Workflows/Invoice.md` (create) | Create a new invoice |
| `invoice list`, `erp:invoice list` | `Workflows/Invoice.md` (list) | List all invoices by status |
| `export invoice`, `erp:invoice export {id}` | `Workflows/Invoice.md` (export) | Generate PDF for an invoice |
| `mark paid`, `erp:invoice mark-paid {id}` | `Workflows/Invoice.md` (mark-paid) | Mark an invoice as paid |
| `erp:expense`, `expense`, `add expense`, `erp:expense create` | `Workflows/Expense.md` (create) | Create a new expense definition |
| `expense list`, `erp:expense list` | `Workflows/Expense.md` (list) | List expenses grouped by status |
| `record payment`, `erp:expense record-payment {id}` | `Workflows/Expense.md` (record-payment) | Record an actual payment for an expense |
| `erp:income`, `income`, `add income`, `erp:income create` | `Workflows/Income.md` (create) | Record ad-hoc income |
| `income list`, `erp:income list` | `Workflows/Income.md` (list) | List all income records |
| `erp:budget`, `budget`, `budget overview` | `Workflows/Budget.md` | Financial overview: committed vs. actual vs. income |

## Data Writing Rules

- **No emdashes**: use colons, commas, or parentheses instead. Applies to all ERP data files.

## Examples

- `erp:invoice create` — Interactive invoice creation
- `erp:invoice list` — All invoices grouped by status with outstanding total
- `erp:invoice export inv-202604-0001` — Generate PDF for that invoice
- `erp:invoice mark-paid inv-202604-0001` — Mark invoice as paid
- `erp:expense create` — Define a new recurring or one-time expense
- `erp:expense list` — All expenses grouped by status with monthly committed total
- `erp:expense record-payment exp-rent` — Record actual payment for an expense
- `erp:income create` — Record ad-hoc income (tax return, grant, etc.)
- `erp:income list` — All income records chronologically
- `erp:budget` — Financial summary: monthly committed, actual spend, income, net balance

## Schemas

Schemas defined in `$PAI_DATA_ROOT/_schemas/`. Invoice template in `$PAI_DATA_ROOT/_templates/invoice.md`.

**Expense fields:** `id`, `type`, `name`, `category` (housing|utilities|subscriptions|transport|food|health|other), `scope` (personal|freelance|mixed), `recurrence` (monthly|annual|one-time), `status` (planned|active|paid|cancelled), `amount_cad`, `amount_original`, `currency_original`, `billing_day`, `next_due`, `start_date`, `end_date`, `tags`, `notes`

**AdHocIncome fields:** `id`, `type`, `name`, `category` (tax-return|grant|salary|gift|other), `scope`, `amount_cad`, `amount_original`, `currency_original`, `date`, `tags`, `notes`

**Payment fields:** `id`, `type`, `expense_id`, `date`, `amount_cad`, `amount_original`, `currency_original`, `notes`, `tags`

## Notes for the Homunculus

- **One entity = one file.** Filename formats: `inv-YYYYMM-NNNN.md`, `exp-{slug}.md`, `inc-{slug}-{year}.md`, `pay-{expense-slug}-{YYYY-MM}.md`
- **Frontmatter is the index.** Body prose provides context; frontmatter enables querying.
- **Always use `--front-matter=extract`** with yq on .md files.
- **id matches filename.** `exp-rent.md` has `id: "exp-rent"`.
- **InvoiceConfig is required** for invoice create and export. It lives at `~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/ERP/InvoiceConfig.md`.
- **PDF exports go in** `$PAI_DATA_ROOT/ERP/exports/invoices/{id}/`
- **Expense categories:** housing, utilities, subscriptions, transport, food, health, other
- **Recurrence:** monthly (uses `billing_day`), annual (uses `next_due`), one-time (uses `next_due`, status starts as `planned`, becomes `paid` once payment is recorded)
- **Expense status lifecycle:** `planned` (created, not yet due) → `active` (recurring, ongoing) → `paid` (one-time, fully paid) → `cancelled` (no longer applicable)
