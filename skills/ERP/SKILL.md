---
name: ERP
description: Invoice and billing management for PAI data layer. Create, list, export to PDF, and manage invoices. USE WHEN erp, invoice, erp:invoice, create invoice, generate invoice, export invoice, mark paid, invoice list, billing, invoicing.
argument-hint: [invoice | invoice:create | invoice:list | invoice:export | invoice:mark-paid]
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
     -d '{"message": "Running the WORKFLOWNAME workflow in the ERP skill to ACTION", "voice_id": "fTtv3eikoepIosk8dTZ5", "voice_enabled": true}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **ERP** skill...
   ```

**This is not optional. Execute this curl command immediately upon skill invocation.**

# ERP Skill

Invoice and billing management via the PAI data layer at `~/.claude/PAI/USER/DATA/ERP/`. Invoices are markdown files with YAML frontmatter. All queries use `~/go/bin/yq` with the `--front-matter=extract` flag.

## Data Location

```
~/.claude/PAI/USER/DATA/ERP/
├── invoices/          # inv-YYYYMM-NNNN.md files
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

## Data Writing Rules

- **No emdashes**: use colons, commas, or parentheses instead. Applies to all ERP data files.

## Examples

- `erp:invoice create` — Interactive invoice creation
- `erp:invoice list` — All invoices grouped by status with outstanding total
- `erp:invoice export inv-202604-0001` — Generate PDF for that invoice
- `erp:invoice mark-paid inv-202604-0001` — Mark invoice as paid

## Schemas

Invoice schema defined in `~/.claude/PAI/USER/DATA/_schemas/`. Template in `~/.claude/PAI/USER/DATA/_templates/invoice.md`.

## Notes for the Homunculus

- **One invoice = one file.** Filename format: `inv-YYYYMM-NNNN.md`
- **Frontmatter is the index.** Body prose provides context; frontmatter enables querying.
- **Always use `--front-matter=extract`** with yq on .md files.
- **id matches filename.** `inv-202604-0001.md` has `id: "inv-202604-0001"`.
- **InvoiceConfig is required** for create and export. It lives at `~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/ERP/InvoiceConfig.md`.
- **PDF exports go in** `~/.claude/PAI/USER/DATA/ERP/exports/invoices/{id}/`
