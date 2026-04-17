#!/usr/bin/env python3
"""
ExportInvoice.py — Generate a PDF invoice from a CRM invoice markdown file.

Usage:
    python3 ExportInvoice.py <invoice.md> <InvoiceConfig.md> <output_dir>

Output:
    <output_dir>/<invoice_number>.pdf
    Prints the output path on success, error message on failure.
"""

import sys
import os
import json
import subprocess
import tempfile
from datetime import date


YQ = os.path.expanduser("~/go/bin/yq")


def run_yq(path: str) -> dict:
    result = subprocess.run(
        [YQ, "--front-matter=extract", ".", path],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError(f"yq failed on {path}: {result.stderr.strip()}")
    # yq outputs YAML — convert to JSON via yq itself
    result2 = subprocess.run(
        [YQ, "--front-matter=extract", "-o=json", ".", path],
        capture_output=True, text=True
    )
    if result2.returncode != 0:
        raise RuntimeError(f"yq JSON conversion failed: {result2.stderr.strip()}")
    return json.loads(result2.stdout)


CRM_DIR = os.path.expanduser("~/.claude/PAI/USER/DATA/CRM")


def lookup_entity(entity_id: str) -> dict:
    """Try to load a CRM entity by id (contact-* or org-*). Returns {} if not found."""
    if not entity_id or entity_id == "null":
        return {}
    for subdir in ("contacts", "organizations"):
        path = os.path.join(CRM_DIR, subdir, f"{entity_id}.md")
        if os.path.isfile(path):
            try:
                return run_yq(path)
            except Exception:
                return {}
    return {}


def fmt_money(amount, currency="CAD") -> str:
    if amount is None:
        return ""
    return f"{amount:,.2f} {currency}"


def fmt_date(d: str) -> str:
    if not d or d == "null":
        return ""
    try:
        y, m, day = d.split("-")
        months = ["", "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"]
        return f"{months[int(m)]} {int(day)}, {y}"
    except Exception:
        return d


def build_line_items_html(items, currency) -> str:
    rows = ""
    for item in items:
        rows += f"""
        <tr>
            <td>{item.get('description', '')}</td>
            <td class="right">{item.get('quantity', '')}</td>
            <td class="right">{fmt_money(item.get('unit_price'), currency)}</td>
            <td class="right">{fmt_money(item.get('amount'), currency)}</td>
        </tr>"""
    return rows


def build_totals_html(inv, currency) -> str:
    subtotal = inv.get("subtotal", 0)
    tax_rate = inv.get("tax_rate")
    tax_amount = inv.get("tax_amount")
    tax_label = inv.get("tax_label", "Tax")
    total = inv.get("total", 0)

    rows = f"""
        <tr class="subtotal-row">
            <td colspan="3" class="right label">Subtotal</td>
            <td class="right">{fmt_money(subtotal, currency)}</td>
        </tr>"""

    if tax_rate and tax_amount:
        pct = f"{tax_rate * 100:.3f}".rstrip("0").rstrip(".")
        rows += f"""
        <tr>
            <td colspan="3" class="right label">{tax_label} ({pct}%)</td>
            <td class="right">{fmt_money(tax_amount, currency)}</td>
        </tr>"""

    rows += f"""
        <tr class="total-row">
            <td colspan="3" class="right label">TOTAL</td>
            <td class="right">{fmt_money(total, currency)}</td>
        </tr>"""

    return rows


def build_html(inv: dict, cfg: dict, client_mode: bool = False) -> str:
    currency = inv.get("currency", cfg.get("default_currency", "CAD"))
    number = inv.get("number", inv.get("id", "INVOICE"))
    status = inv.get("status", "draft").upper()
    status_color = {
        "DRAFT": "#6b7280",
        "SENT": "#2563eb",
        "PAID": "#16a34a",
        "OVERDUE": "#dc2626",
        "CANCELLED": "#9ca3af",
    }.get(status, "#374151")

    sender_name = cfg.get("sender_name", "")
    sender_address = cfg.get("sender_address", "").strip().replace("\n", "<br>")
    sender_email = cfg.get("sender_email", "")
    sender_phone = cfg.get("sender_phone", "")
    gst_number = cfg.get("gst_number", "")
    qst_number = cfg.get("qst_number", "")
    payment_instructions = cfg.get("payment_instructions", "").strip().replace("{invoice number}", number).replace("\n", "<br>")

    # CRM lookups
    org_id = inv.get("organization_id", "")
    contact_id = inv.get("contact", "")
    org_record = lookup_entity(org_id)
    contact_record = lookup_entity(contact_id)

    # Bill To fields — prefer CRM record data, fall back to invoice fields
    org = org_record.get("name") or inv.get("organization", "")
    org_domain = org_record.get("domain", "")
    org_address = org_record.get("address", "").strip().replace("\n", "<br>") if org_record.get("address") else ""
    org_phone = org_record.get("phone", "")
    contact_name = contact_record.get("name", "")
    contact_role = contact_record.get("role", "")
    contact_email = contact_record.get("email", "")

    issue_date = fmt_date(inv.get("issue_date", ""))
    due_date = fmt_date(inv.get("due_date", ""))
    paid_date = fmt_date(inv.get("paid_date", ""))
    notes = inv.get("notes", "")

    line_items = inv.get("line_items", [])
    line_rows = build_line_items_html(line_items, currency)
    total_rows = build_totals_html(inv, currency)

    tax_ids_html = ""
    if gst_number:
        tax_ids_html += f"<p>GST #: {gst_number}</p>"
    if qst_number:
        tax_ids_html += f"<p>QST #: {qst_number}</p>"

    paid_row = ""
    if paid_date:
        paid_row = f"<tr><td class='label'>Paid on</td><td>{paid_date}</td></tr>"

    # Build Bill To lines from CRM data
    bill_to_lines = ""
    if org_address:
        bill_to_lines += f"<p>{org_address}</p>"
    if org_phone:
        bill_to_lines += f"<p>{org_phone}</p>"
    if org_domain:
        bill_to_lines += f"<p>{org_domain}</p>"
    if contact_name:
        role_suffix = f" — {contact_role}" if contact_role else ""
        bill_to_lines += f"<p>{contact_name}{role_suffix}</p>"
    if contact_email:
        bill_to_lines += f"<p>{contact_email}</p>"

    sender_contact = ""
    if sender_email:
        sender_contact += f"<p>{sender_email}</p>"
    if sender_phone:
        sender_contact += f"<p>{sender_phone}</p>"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 12px;
    color: #1f2937;
    line-height: 1.4;
    padding: 20px 36px;
    max-width: 800px;
    margin: 0 auto;
  }}

  /* Header */
  .header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 2px solid #1e3a8a;
  }}
  .sender-block h1 {{
    font-size: 16px;
    font-weight: 700;
    color: #1e3a8a;
    margin-bottom: 3px;
  }}
  .sender-block p {{
    color: #4b5563;
    font-size: 11px;
    line-height: 1.4;
  }}
  .invoice-meta {{
    text-align: right;
  }}
  .invoice-meta .invoice-number {{
    font-size: 18px;
    font-weight: 800;
    color: #1e3a8a;
    letter-spacing: 0.5px;
  }}
  .status-badge {{
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: white;
    background: {status_color};
    margin-top: 3px;
  }}
  .invoice-meta table {{
    margin-top: 5px;
    margin-left: auto;
    font-size: 11px;
  }}
  .invoice-meta td {{
    padding: 1px 0 1px 10px;
  }}
  .invoice-meta .label {{
    color: #6b7280;
    text-align: right;
  }}

  /* Bill-to */
  .bill-section {{
    display: flex;
    gap: 32px;
    margin-bottom: 14px;
  }}
  .bill-block h3 {{
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #6b7280;
    margin-bottom: 4px;
  }}
  .bill-block p {{
    font-size: 12px;
    line-height: 1.4;
  }}
  .bill-block .org-name {{
    font-weight: 700;
    font-size: 13px;
    color: #111827;
  }}

  /* Line items table */
  .items-table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0;
  }}
  .items-table thead th {{
    background: #1e3a8a;
    color: white;
    padding: 6px 10px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .items-table thead th.right {{ text-align: right; }}
  .items-table tbody td {{
    padding: 6px 10px;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
  }}
  .items-table tbody tr:last-child td {{ border-bottom: none; }}
  .items-table tbody tr:nth-child(even) {{ background: #f9fafb; }}
  .right {{ text-align: right; }}

  /* Totals */
  .totals-section {{
    display: flex;
    justify-content: flex-end;
    margin-top: 0;
  }}
  .totals-table {{
    width: 300px;
    border-collapse: collapse;
    border-top: 2px solid #e5e7eb;
  }}
  .totals-table td {{
    padding: 7px 12px;
    font-size: 13px;
  }}
  .totals-table .label {{ color: #4b5563; }}
  .totals-table .subtotal-row td {{ border-top: 1px solid #e5e7eb; }}
  .totals-table .total-row td {{
    font-weight: 700;
    font-size: 15px;
    border-top: 2px solid #1e3a8a;
    color: #1e3a8a;
    padding-top: 10px;
  }}

  /* Notes */
  .notes-section {{
    margin-top: 28px;
    padding: 14px 16px;
    background: #f3f4f6;
    border-left: 3px solid #93c5fd;
    border-radius: 2px;
    font-size: 12px;
    color: #374151;
  }}
  .notes-section strong {{ display: block; margin-bottom: 4px; color: #1f2937; }}

  /* Payment */
  .payment-section {{
    margin-top: 24px;
    padding: 14px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    font-size: 12px;
    color: #374151;
  }}
  .payment-section strong {{ display: block; margin-bottom: 6px; font-size: 13px; color: #1e3a8a; }}

  /* Footer */
  .footer {{
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    font-size: 11px;
    color: #9ca3af;
    text-align: center;
  }}
  .footer p {{ margin: 2px 0; }}

  @media print {{
    body {{ padding: 20px 28px; }}
    .header {{ break-after: avoid; }}
    .items-table thead {{ break-after: avoid; }}
    tr {{ break-inside: avoid; }}
  }}
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="sender-block">
    <h1>{sender_name}</h1>
    <p>{sender_address}</p>
    {sender_contact}
  </div>
  <div class="invoice-meta">
    <div class="invoice-number">{number}</div>
    {"" if client_mode else f'<div><span class="status-badge">{status}</span></div>'}
    <table>
      <tr><td class="label">Issue date</td><td>{issue_date}</td></tr>
      <tr><td class="label">Due date</td><td>{due_date}</td></tr>
      {paid_row}
    </table>
  </div>
</div>

<!-- BILL TO -->
<div class="bill-section">
  <div class="bill-block">
    <h3>Bill To</h3>
    <p class="org-name">{org}</p>
    {bill_to_lines}
  </div>
</div>

<!-- LINE ITEMS -->
<table class="items-table">
  <thead>
    <tr>
      <th>Description</th>
      <th class="right">Qty</th>
      <th class="right">Unit Price</th>
      <th class="right">Amount</th>
    </tr>
  </thead>
  <tbody>
    {line_rows}
  </tbody>
</table>

<!-- TOTALS -->
<div class="totals-section">
  <table class="totals-table">
    {total_rows}
  </table>
</div>

{"<div class='notes-section'><strong>Notes</strong>" + notes + "</div>" if notes else ""}

<!-- PAYMENT INSTRUCTIONS -->
{"<div class='payment-section'><strong>Payment Instructions</strong><p>" + payment_instructions + "</p></div>" if payment_instructions else ""}

<!-- FOOTER -->
<div class="footer">
  {tax_ids_html}
  <p>Thank you for your business.</p>
</div>

</body>
</html>"""


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    client_mode = "--client" in sys.argv

    if len(args) < 3:
        print("Usage: ExportInvoice.py <invoice.md> <InvoiceConfig.md> <output_dir> [--client]", file=sys.stderr)
        sys.exit(1)

    invoice_path = os.path.expanduser(args[0])
    config_path = os.path.expanduser(args[1])
    output_dir = os.path.expanduser(args[2])

    for path, label in [(invoice_path, "invoice"), (config_path, "InvoiceConfig.md")]:
        if not os.path.isfile(path):
            print(f"Error: {label} not found: {path}", file=sys.stderr)
            sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    inv = run_yq(invoice_path)
    cfg = run_yq(config_path)

    number = inv.get("number", inv.get("id", "INVOICE"))
    pdf_filename = f"{number}-client.pdf" if client_mode else f"{number}.pdf"
    pdf_path = os.path.join(output_dir, pdf_filename)

    html = build_html(inv, cfg, client_mode=client_mode)

    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
        f.write(html)
        tmp_html = f.name

    try:
        result = subprocess.run(
            [
                "wkhtmltopdf",
                "--page-size", "Letter",
                "--margin-top", "15mm",
                "--margin-bottom", "15mm",
                "--margin-left", "15mm",
                "--margin-right", "15mm",
                "--enable-local-file-access",
                "--quiet",
                tmp_html,
                pdf_path,
            ],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"wkhtmltopdf error: {result.stderr.strip()}", file=sys.stderr)
            sys.exit(1)
    finally:
        os.unlink(tmp_html)

    print(pdf_path)


if __name__ == "__main__":
    main()
