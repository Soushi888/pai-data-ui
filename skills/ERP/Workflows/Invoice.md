# Invoice Workflow

Create, list, export, and manage invoices within the ERP data layer.

## Sub-command Routing

| Argument | Action |
|----------|--------|
| `create` or no argument with invoice context | Create a new invoice |
| `list` | List all invoices grouped by status |
| `export {id}` | Generate PDF for an invoice |
| `mark-paid {id}` | Mark an invoice as paid |

## Tax Flags

Taxes are **off by default** (`default_apply_taxes: false` in InvoiceConfig.md). Override per invoice:

| Flag / keyword | Effect |
|----------------|--------|
| `--taxes` / `with taxes` / `taxable` | Apply `default_tax_rate` + `default_tax_label` from config |
| `--no-taxes` / `no tax` / `tax exempt` | Force no tax (explicit, for clarity) |

When `--taxes` is active, compute and write `tax_rate`, `tax_label`, `tax_amount` fields into the invoice frontmatter and include the tax row in the PDF.

---

## create — New Invoice

### 1. Load Config

Read sender defaults from `~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/ERP/InvoiceConfig.md`:

```bash
~/go/bin/yq --front-matter=extract '{
  currency: .default_currency,
  apply_taxes: .default_apply_taxes,
  tax_rate: .default_tax_rate,
  tax_label: .default_tax_label,
  terms_days: .default_payment_terms_days,
  sequence: .invoice_number_sequence
}' ~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/ERP/InvoiceConfig.md
```

If the file does not exist, output:
```
⚠ InvoiceConfig.md not found. Create it at:
  ~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/ERP/InvoiceConfig.md

Use the template in $PAI_DATA_ROOT/_templates/invoice.md as reference.
Fill in sender_name, sender_address, sender_email, and payment_instructions.
```
Then abort.

### 2. Auto-Generate Invoice Number

**Format:** `IN{YY}{MM}-{NNNN}` where:
- `YY` = 2-digit year of issue date (e.g. `26`)
- `MM` = 2-digit month of issue date (e.g. `04`)
- `NNNN` = global 4-digit sequence, zero-padded, incrementing across all invoices forever

**Determine next sequence number:**

Read `invoice_number_sequence` from InvoiceConfig.md. This field always holds the NEXT number to use. After creating the invoice, increment it by 1 and write it back:

```bash
# Read current sequence
NEXT=$(~/go/bin/yq --front-matter=extract '.invoice_number_sequence' ~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/ERP/InvoiceConfig.md)

# Build the display number (use issue_date year/month)
YY=$(date +%y)
MM=$(date +%m)
NUMBER="IN${YY}${MM}-$(printf '%04d' $NEXT)"

# After writing the invoice file, increment sequence in config
~/go/bin/yq --front-matter=process ".invoice_number_sequence = $((NEXT + 1))" \
  ~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/ERP/InvoiceConfig.md
```

- File ID: `inv-{YYYYMM}-{NNNN}` (e.g. `inv-202604-0005`) — use this as the filename
- Display number: `IN{YY}{MM}-{NNNN}` (e.g. `IN2604-0005`)

### 3. Gather Invoice Details

Extract from command arguments if provided. Otherwise prompt for:

**Client info:**
- Organization name (required)
- Contact ID — optional. If provided, verify file exists: `ls $PAI_DATA_ROOT/CRM/contacts/contact-{id}.md`
- Opportunity ID — optional link to an existing opportunity

**Line items** (loop until user enters empty line):
```
Line item 1:
  Description: Web development — sprint 1
  Quantity: 10
  Unit price (CAD): 150
  → Amount: 1500.00

Line item 2 (Enter to finish):
```

After all items are entered, compute:
- `subtotal` = sum of all `amount` values
- `tax_amount` = round(`subtotal` * `tax_rate`, 2)
- `total` = `subtotal` + `tax_amount`

**Tags:** infer from organization and opportunity if available; otherwise ask.

### 4. Compute Dates

- `issue_date` = today (YYYY-MM-DD)
- `due_date` = today + `default_payment_terms_days` days

### 5. Write the Invoice File

Path: `$PAI_DATA_ROOT/ERP/invoices/inv-YYYY-NNN.md`

```yaml
---
id: "inv-YYYY-NNN"
type: "invoice"
number: "{prefix}-YYYY-NNN"
contact: "{contact-id or omit}"
organization: "{organization}"
status: "draft"
currency: "{currency}"
issue_date: "{issue_date}"
due_date: "{due_date}"
paid_date: null
opportunity: {opp-id or null}
tags:
  - {tag}
line_items:
  - description: "{desc}"
    quantity: {qty}
    unit_price: {unit}
    amount: {amount}
subtotal: {subtotal}
tax_rate: {tax_rate}
tax_label: "{tax_label}"
tax_amount: {tax_amount}
total: {total}
created: "{issue_date}"
updated: "{issue_date}"
notes: ""
---

## Invoice Notes

Payment terms: {default_payment_terms_days} days net.
```

Omit `contact`, `opportunity`, `tax_rate`, `tax_label`, `tax_amount` fields entirely when not applicable rather than writing null/0.

### 6. Verify

```bash
~/go/bin/yq --front-matter=extract '.number' $PAI_DATA_ROOT/ERP/invoices/inv-YYYY-NNN.md
```

Must return the invoice number without error.

### 7. Confirm

```
✅ Invoice created: inv-YYYY-NNN.md

Number:       INV-2026-001
Organization: Acme Corp
Status:       draft
Issue date:   2026-04-02
Due date:     2026-05-02
Subtotal:     1500.00 CAD
Tax (GST+QST): 224.63 CAD
Total:        1724.63 CAD

Export to PDF: crm:invoice export inv-2026-001
```

---

## list — Invoice Pipeline

### 1. Scan

```bash
ls $PAI_DATA_ROOT/ERP/invoices/
```

If empty: "No invoices found. Create one with `crm:invoice create`."

### 2. Extract Fields

For each `.md` file:

```bash
~/go/bin/yq --front-matter=extract '{
  number: .number,
  organization: .organization,
  status: .status,
  total: .total,
  currency: .currency,
  due_date: .due_date,
  paid_date: .paid_date
}' $PAI_DATA_ROOT/ERP/invoices/{file}.md
```

Flag as overdue: `status == "sent"` AND `due_date < today`.

### 3. Render

Group by status order: sent/overdue → draft → paid → cancelled

```
## Invoices — 2026-04-02

### Sent / Overdue (2)
| Number       | Organization | Total       | Due        | Status  |
|--------------|-------------|-------------|------------|---------|
| INV-2026-001 | Acme Corp   | 1724.63 CAD | 2026-05-02 | sent    |
| INV-2026-002 | Beta Ltd    | 500.00 CAD  | 2026-03-15 | ⚠ OVERDUE |

### Draft (1)
| Number       | Organization | Total      | Due        |
|--------------|-------------|------------|------------|
| INV-2026-003 | Gamma Inc   | 200.00 CAD | 2026-05-10 |

### Paid (1)
| Number       | Organization | Total       | Paid       |
|--------------|-------------|-------------|------------|
| INV-2025-012 | Acme Corp   | 900.00 CAD  | 2026-01-20 |
```

### 4. Summary

```
Total: {n} invoices | Outstanding: {sum} CAD | Paid YTD: {sum} CAD
```

---

## export — Generate PDF

### 1. Validate

Check invoice file exists:
```bash
ls $PAI_DATA_ROOT/ERP/invoices/{id}.md
```

Check InvoiceConfig.md exists (same check as create step 1).

### 2. Ensure Output Directory

```bash
mkdir -p $PAI_DATA_ROOT/ERP/exports/invoices/{id}/
```

### 3. Run Export Tool

```bash
python3 ~/.claude/skills/ERP/Tools/ExportInvoice.py \
  $PAI_DATA_ROOT/ERP/invoices/{id}.md \
  ~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/ERP/InvoiceConfig.md \
  $PAI_DATA_ROOT/ERP/exports/invoices/{id}/
```

The script prints the output PDF path on success, or an error message on failure.

### 4. Confirm

```
✅ PDF exported: $PAI_DATA_ROOT/ERP/exports/invoices/inv-2026-001/IN2604-0006.pdf
```

---

## mark-paid — Update Status

### 1. Read Invoice

```bash
~/go/bin/yq --front-matter=extract '{status: .status, number: .number}' \
  $PAI_DATA_ROOT/ERP/invoices/{id}.md
```

If status is already `paid`: "Invoice {number} is already marked as paid."
If status is `cancelled`: "Cannot mark a cancelled invoice as paid."

### 2. Update

Use `yq` to update frontmatter fields in place:

```bash
~/go/bin/yq --front-matter=process \
  '.status = "paid" | .paid_date = "{today}" | .updated = "{today}"' \
  $PAI_DATA_ROOT/ERP/invoices/{id}.md
```

### 3. Confirm

```
✅ Invoice {number} marked as paid on {today}.
```
