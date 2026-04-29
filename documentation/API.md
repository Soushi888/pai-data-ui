# pai-data-ui REST API

All endpoints return JSON. The server does not serve HTML from the API routes. In production the base URL is `http://localhost:4173`. During development with `vite dev` the base URL is `http://localhost:5173`.

Error responses follow a consistent shape across all endpoints:

```json
{
  "type": "/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Entity 'contact-jane-doe' does not exist"
}
```

The `type` field takes one of three values: `/errors/not-found` (404), `/errors/validation-error` (400), or `/errors/server-error` (500).

---

## Table of Contents

- [CRM](#crm)
  - [Contacts](#contacts)
  - [Opportunities](#opportunities)
  - [Organizations](#organizations)
- [ERP](#erp)
  - [Invoices](#invoices)
  - [Expenses](#expenses)
  - [Income](#income)
- [PM](#pm)
  - [Projects](#projects)
  - [Tasks](#tasks)
  - [Focus](#focus)
- [Global](#global)
  - [Search](#search)
  - [Health](#health)
- [ValueFlows](#valueflows)

---

## CRM

### Contacts

#### GET /api/contacts

Returns a filtered and sorted list of contacts. Results are sorted by `last_contact` descending (most recently contacted first).

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | Filter by relationship status. Accepted values: `active`, `inactive`, `prospect`. |
| `tag` | string | No | Filter to contacts whose `tags` array contains this exact string. |
| `q` | string | No | Case-insensitive substring search across `name`, `organization`, and `role`. |

**Response: 200 OK**

```json
{
  "contacts": [
    {
      "id": "contact-jane-doe",
      "type": "contact",
      "name": "Jane Doe",
      "nickname": "Jane",
      "organization": "Acme Corp",
      "role": "Engineering Lead",
      "tags": ["client", "technical"],
      "status": "active",
      "last_contact": "2026-04-20",
      "created": "2025-01-15",
      "email": "jane@acme.com",
      "github": "janedoe",
      "timezone": "America/Montreal"
    }
  ],
  "total": 1
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to read the contacts data directory. |

---

#### POST /api/contacts

Creates a new contact. The `id` is derived from the `name` field by the server.

**Request body**

```json
{
  "name": "Jane Doe",
  "organization": "Acme Corp",
  "role": "Engineering Lead",
  "status": "active",
  "last_contact": "2026-04-20",
  "tags": ["client"],
  "nickname": "Jane",
  "email": "jane@acme.com",
  "github": "janedoe",
  "timezone": "America/Montreal"
}
```

Required fields: `name`, `organization`, `role`, `status`, `last_contact`, `tags`. All other fields are optional.

**Response: 201 Created**

```json
{
  "contact": {
    "id": "contact-jane-doe",
    "type": "contact",
    "name": "Jane Doe",
    "organization": "Acme Corp",
    "role": "Engineering Lead",
    "tags": ["client"],
    "status": "active",
    "last_contact": "2026-04-20",
    "created": "2026-04-27"
  }
}
```

**Error responses**

| Status | When |
|---|---|
| 400 | A required field is missing or fails validation. |
| 500 | Failed to write the contact file. |

---

#### GET /api/contacts/[id]

Returns the full contact record for the given ID. The response is the Contact object directly (not wrapped in a key).

**Path parameters**

| Name | Description |
|---|---|
| `id` | The contact ID, e.g. `contact-jane-doe`. |

**Response: 200 OK**

```json
{
  "id": "contact-jane-doe",
  "type": "contact",
  "name": "Jane Doe",
  "organization": "Acme Corp",
  "role": "Engineering Lead",
  "tags": ["client"],
  "status": "active",
  "last_contact": "2026-04-20",
  "created": "2025-01-15"
}
```

**Error responses**

| Status | When |
|---|---|
| 404 | No contact with the given ID exists. |

---

#### PATCH /api/contacts/[id]

Partially updates a contact. Only the fields included in the request body are changed.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The contact ID to update. |

**Request body**

Any subset of writable Contact fields. Example:

```json
{
  "last_contact": "2026-04-27",
  "tags": ["client", "vip"]
}
```

**Response: 200 OK**

```json
{
  "contact": {
    "id": "contact-jane-doe",
    "type": "contact",
    "name": "Jane Doe",
    "organization": "Acme Corp",
    "role": "Engineering Lead",
    "tags": ["client", "vip"],
    "status": "active",
    "last_contact": "2026-04-27",
    "created": "2025-01-15"
  }
}
```

**Error responses**

| Status | When |
|---|---|
| 404 | No contact with the given ID exists. |
| 400 | A field value fails validation. |

---

#### DELETE /api/contacts/[id]

Soft-deletes a contact by setting its `status` to `inactive`. The record is not removed from disk.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The contact ID to deactivate. |

**Response: 204 No Content**

Empty body.

**Error responses**

| Status | When |
|---|---|
| 404 | No contact with the given ID exists. |

---

#### POST /api/contacts/[id]/raw

Overwrites the raw markdown source file for a contact. This endpoint is used by the in-app editor to save free-form notes and frontmatter directly.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The contact ID whose file will be overwritten. |

**Request body**

```json
{
  "content": "---\nid: contact-jane-doe\nname: Jane Doe\n---\n\n## Notes\n\nMet at conference."
}
```

**Response: 200 OK**

```json
{
  "success": true
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to write the file to disk. |

---

### Opportunities

#### GET /api/opportunities

Returns a filtered list of opportunities.

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | Filter by opportunity status. Accepted values: `prospect`, `active`, `won`, `lost`, `on-hold`, `archived`. |
| `contact` | string | No | Filter by the contact ID associated with the opportunity. |

**Response: 200 OK**

```json
{
  "opportunities": [
    {
      "id": "opportunity-acme-platform",
      "type": "opportunity",
      "title": "Acme Platform Rebuild",
      "contact": "contact-jane-doe",
      "organization": "Acme Corp",
      "status": "active",
      "value_cad": 15000,
      "tags": ["platform", "q2"],
      "created": "2026-01-10",
      "updated": "2026-04-20",
      "description": "Full rebuild of internal tooling."
    }
  ],
  "total": 1
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to read the opportunities data directory. |

---

#### POST /api/opportunities

Creates a new opportunity.

**Request body**

```json
{
  "title": "Acme Platform Rebuild",
  "contact": "contact-jane-doe",
  "organization": "Acme Corp",
  "status": "prospect",
  "tags": [],
  "value_cad": 15000,
  "description": "Full rebuild of internal tooling."
}
```

Required fields: `title`, `contact`, `organization`, `status`, `tags`. All other fields are optional.

**Response: 201 Created**

```json
{
  "opportunity": {
    "id": "opportunity-acme-platform",
    "type": "opportunity",
    "title": "Acme Platform Rebuild",
    "contact": "contact-jane-doe",
    "organization": "Acme Corp",
    "status": "prospect",
    "tags": [],
    "created": "2026-04-27",
    "updated": "2026-04-27"
  }
}
```

**Error responses**

| Status | When |
|---|---|
| 400 | A required field is missing or fails validation. |
| 500 | Failed to write the opportunity file. |

---

#### GET /api/opportunities/[id]

Returns the full opportunity record. The response is the Opportunity object directly.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The opportunity ID. |

**Response: 200 OK**

The full Opportunity object as shown in the list response above.

**Error responses**

| Status | When |
|---|---|
| 404 | No opportunity with the given ID exists. |

---

#### PATCH /api/opportunities/[id]

Partially updates an opportunity.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The opportunity ID to update. |

**Request body**

Any subset of writable Opportunity fields. Example:

```json
{
  "status": "won",
  "value_cad": 18000
}
```

**Response: 200 OK**

```json
{
  "opportunity": { ... }
}
```

The full updated Opportunity object is returned under the `opportunity` key.

**Error responses**

| Status | When |
|---|---|
| 404 | No opportunity with the given ID exists. |
| 400 | A field value fails validation. |

---

#### POST /api/opportunities/[id]/raw

Overwrites the raw markdown source file for an opportunity.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The opportunity ID whose file will be overwritten. |

**Request body**

```json
{
  "content": "---\nid: opportunity-acme-platform\n---\n\n## Context\n\nDetailed notes."
}
```

**Response: 200 OK**

```json
{
  "success": true
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to write the file to disk. |

---

### Organizations

#### GET /api/organizations

Returns a filtered list of organizations.

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | Filter by organization status. Accepted values: `active`, `inactive`. |
| `tag` | string | No | Filter to organizations whose `tags` array contains this exact string. |

**Response: 200 OK**

```json
{
  "organizations": [
    {
      "id": "org-acme-corp",
      "type": "organization",
      "name": "Acme Corp",
      "domain": "acme.com",
      "address": "123 Main St, Montreal, QC",
      "phone": "+1-514-555-0000",
      "tags": ["client"],
      "status": "active",
      "created": "2025-06-01"
    }
  ],
  "total": 1
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to read the organizations data directory. |

---

#### POST /api/organizations

Creates a new organization.

**Request body**

```json
{
  "name": "Acme Corp",
  "domain": "acme.com",
  "status": "active",
  "tags": ["client"],
  "address": "123 Main St",
  "phone": "+1-514-555-0000"
}
```

Required fields: `name`, `domain`, `status`, `tags`. All other fields are optional.

**Response: 201 Created**

```json
{
  "organization": {
    "id": "org-acme-corp",
    "type": "organization",
    "name": "Acme Corp",
    "domain": "acme.com",
    "tags": ["client"],
    "status": "active",
    "created": "2026-04-27"
  }
}
```

**Error responses**

| Status | When |
|---|---|
| 400 | A required field is missing or fails validation. |
| 500 | Failed to write the organization file. |

---

#### GET /api/organizations/[id]

Returns the full organization record. The response is the Organization object directly.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The organization ID. |

**Response: 200 OK**

The full Organization object as shown in the list response above.

**Error responses**

| Status | When |
|---|---|
| 404 | No organization with the given ID exists. |

---

#### PATCH /api/organizations/[id]

Partially updates an organization.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The organization ID to update. |

**Request body**

Any subset of writable Organization fields. Example:

```json
{
  "status": "inactive"
}
```

**Response: 200 OK**

```json
{
  "organization": { ... }
}
```

The full updated Organization object is returned under the `organization` key.

**Error responses**

| Status | When |
|---|---|
| 404 | No organization with the given ID exists. |
| 400 | A field value fails validation. |

---

#### POST /api/organizations/[id]/raw

Overwrites the raw markdown source file for an organization.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The organization ID whose file will be overwritten. |

**Request body**

```json
{
  "content": "---\nid: org-acme-corp\n---\n\n## About\n\nProfile notes."
}
```

**Response: 200 OK**

```json
{
  "success": true
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to write the file to disk. |

---

## ERP

### Invoices

#### GET /api/invoices

Returns a filtered list of invoices sorted by `issue_date` descending (most recent first).

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | Filter by invoice status. Accepted values: `draft`, `sent`, `paid`, `overdue`, `cancelled`. |
| `org` | string | No | Case-insensitive substring match against the `organization` field. |

**Response: 200 OK**

```json
{
  "invoices": [
    {
      "id": "invoice-in000042",
      "type": "invoice",
      "number": "IN000042",
      "contact": "contact-jane-doe",
      "organization": "Acme Corp",
      "organization_id": "org-acme-corp",
      "status": "sent",
      "currency": "CAD",
      "issue_date": "2026-04-01",
      "due_date": "2026-05-01",
      "paid_date": null,
      "opportunity": null,
      "tags": [],
      "line_items": [
        {
          "description": "Backend development, April",
          "quantity": 40,
          "unit_price": 125,
          "amount": 5000
        }
      ],
      "subtotal": 5000,
      "tax_rate": 0.15,
      "tax_label": "QST+GST",
      "tax_amount": 750,
      "total": 5750,
      "created": "2026-04-01T09:00:00Z",
      "updated": "2026-04-01T09:00:00Z",
      "notes": "Net 30 payment terms."
    }
  ],
  "total": 1
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to read the invoices data directory. |

---

#### POST /api/invoices

Creates a new invoice. If `organization_id` is not provided but `organization` (a name string) is, the server will create a new Organization record automatically. Similarly, if `contact_id` is not provided but `contact_name` is, the server creates a new Contact record automatically.

**Request body**

```json
{
  "number": "IN000043",
  "organization": "Acme Corp",
  "organization_id": "org-acme-corp",
  "contact_id": "contact-jane-doe",
  "status": "draft",
  "currency": "CAD",
  "issue_date": "2026-04-27",
  "due_date": "2026-05-27",
  "tags": [],
  "line_items": [
    {
      "description": "Consulting",
      "quantity": 10,
      "unit_price": 150,
      "amount": 1500
    }
  ],
  "subtotal": 1500,
  "total": 1500
}
```

The fields `organization_id` and `contact_id` are optional. If omitted, pass `organization` and `contact_name` respectively and the server will resolve or create the linked records.

**Response: 201 Created**

```json
{
  "invoice": { ... }
}
```

The full created Invoice object is returned under the `invoice` key.

**Error responses**

| Status | When |
|---|---|
| 400 | A required field is missing or fails validation. |
| 500 | Failed to write the invoice file. |

---

#### GET /api/invoices/[id]

Returns the full invoice record. The response is the Invoice object directly.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The invoice ID, e.g. `invoice-in000042`. |

**Response: 200 OK**

The full Invoice object as shown in the list response above.

**Error responses**

| Status | When |
|---|---|
| 404 | No invoice with the given ID exists. |

---

#### PATCH /api/invoices/[id]

Partially updates an invoice.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The invoice ID to update. |

**Request body**

Any subset of writable Invoice fields. Example:

```json
{
  "status": "paid",
  "paid_date": "2026-05-02"
}
```

**Response: 200 OK**

```json
{
  "invoice": { ... }
}
```

The full updated Invoice object is returned under the `invoice` key.

**Error responses**

| Status | When |
|---|---|
| 404 | No invoice with the given ID exists. |
| 400 | A field value fails validation. |

---

#### POST /api/invoices/[id]/raw

Overwrites the raw markdown source file for an invoice.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The invoice ID whose file will be overwritten. |

**Request body**

```json
{
  "content": "---\nid: invoice-in000042\n---\n\n## Notes\n\nAdditional payment instructions."
}
```

**Response: 200 OK**

```json
{
  "success": true
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to write the file to disk. |

---

#### GET /api/invoices/[id]/pdf

Downloads the PDF for an invoice. If a pre-generated PDF file exists on disk it is served directly as an inline response. Otherwise the server generates the PDF on the fly and returns it as an attachment.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The invoice ID. |

**Response: 200 OK**

Binary PDF content with the following headers:

```
Content-Type: application/pdf
Content-Disposition: inline; filename="invoice-in000042.pdf"
```

When generated on the fly, `Content-Disposition` uses `attachment` instead of `inline`.

**Error responses**

| Status | When |
|---|---|
| 404 | No invoice with the given ID exists (plain text body: `Invoice not found`). |

---

### Expenses

#### GET /api/expenses

Returns all expense records. No filtering is applied server-side.

**Response: 200 OK**

```json
{
  "expenses": [
    {
      "id": "expense-aws-hosting",
      "type": "expense",
      "name": "AWS Hosting",
      "category": "subscriptions",
      "scope": "freelance",
      "recurrence": "monthly",
      "status": "active",
      "amount_cad": 45.00,
      "amount_original": 32.00,
      "currency_original": "USD",
      "billing_day": 1,
      "next_due": "2026-05-01",
      "start_date": "2024-01-01",
      "end_date": null,
      "tags": ["infrastructure"],
      "notes": null,
      "created": "2024-01-01T00:00:00Z",
      "updated": "2026-04-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to read the expenses data directory. |

---

#### POST /api/expenses

Creates a new expense record.

**Request body**

```json
{
  "name": "AWS Hosting",
  "category": "subscriptions",
  "scope": "freelance",
  "recurrence": "monthly",
  "status": "active",
  "amount_cad": 45.00,
  "amount_original": 32.00,
  "currency_original": "USD",
  "billing_day": 1,
  "next_due": "2026-05-01",
  "start_date": "2024-01-01",
  "tags": ["infrastructure"],
  "notes": null
}
```

Required fields: `name`, `category`, `scope`, `recurrence`, `amount_cad`. Optional fields: `status` (defaults to `active`), `amount_original` (defaults to `amount_cad`), `currency_original` (defaults to `CAD`), `billing_day` (defaults to `null`), `next_due` (defaults to `null`), `start_date` (defaults to today), `tags` (defaults to `[]`), `notes` (defaults to `null`).

Valid values for `category`: `housing`, `utilities`, `subscriptions`, `transport`, `food`, `health`, `other`.
Valid values for `recurrence`: `monthly`, `annual`, `one-time`.
Valid values for `scope`: `personal`, `freelance`, `mixed`.

**Response: 201 Created**

```json
{
  "expense": { ... }
}
```

The full created Expense object is returned under the `expense` key.

**Error responses**

| Status | When |
|---|---|
| 400 | A required field is missing or fails validation. |
| 500 | Failed to write the expense file. |

---

#### GET /api/expenses/[id]

Returns a single expense record.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The expense ID. |

**Response: 200 OK**

```json
{
  "expense": {
    "id": "expense-aws-hosting",
    "type": "expense",
    "name": "AWS Hosting",
    ...
  }
}
```

Note: the response wraps the expense data under an `expense` key (unlike some other GET-by-id endpoints which return the object directly).

**Error responses**

| Status | When |
|---|---|
| 404 | No expense with the given ID exists. |

---

#### PATCH /api/expenses/[id]

Partially updates an expense record.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The expense ID to update. |

**Request body**

Any subset of writable Expense fields. Example:

```json
{
  "status": "cancelled",
  "end_date": "2026-04-30"
}
```

**Response: 200 OK**

```json
{
  "expense": { ... }
}
```

The full updated Expense object is returned under the `expense` key.

**Error responses**

| Status | When |
|---|---|
| 404 | No expense with the given ID exists. |
| 400 | A field value fails validation. |

---

#### POST /api/expenses/[id]/payments

Records a payment against an expense. This creates a new Payment record linked to the expense.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The expense ID the payment is settling. |

**Request body**

```json
{
  "date": "2026-04-27",
  "amount_cad": 45.00,
  "amount_original": 32.00,
  "currency_original": "USD",
  "notes": "April billing cycle"
}
```

Required fields: `date`, `amount_cad`. Optional fields: `amount_original` (defaults to `amount_cad`), `currency_original` (defaults to `CAD`), `notes` (defaults to `null`).

**Response: 201 Created**

```json
{
  "payment": {
    "id": "payment-expense-aws-hosting-20260427",
    "type": "payment",
    "expense_id": "expense-aws-hosting",
    "date": "2026-04-27",
    "amount_cad": 45.00,
    "amount_original": 32.00,
    "currency_original": "USD",
    "notes": "April billing cycle",
    "tags": [],
    "created": "2026-04-27T12:00:00Z"
  }
}
```

**Error responses**

| Status | When |
|---|---|
| 400 | A required field is missing or fails validation. |
| 500 | Failed to write the payment file. |

---

### Income

#### GET /api/income

Returns all ad-hoc income records. No filtering is applied server-side.

**Response: 200 OK**

```json
{
  "income": [
    {
      "id": "income-tax-return-2025",
      "type": "income",
      "name": "Tax Return 2025",
      "category": "tax-return",
      "scope": "personal",
      "amount_cad": 1200.00,
      "amount_original": 1200.00,
      "currency_original": "CAD",
      "date": "2026-04-15",
      "tags": [],
      "notes": null,
      "created": "2026-04-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to read the income data directory. |

---

#### POST /api/income

Records a new ad-hoc income entry.

**Request body**

```json
{
  "name": "Tax Return 2025",
  "category": "tax-return",
  "scope": "personal",
  "amount_cad": 1200.00,
  "amount_original": 1200.00,
  "currency_original": "CAD",
  "date": "2026-04-15",
  "tags": [],
  "notes": null
}
```

Required fields: `name`, `category`, `scope`, `amount_cad`, `date`. Optional fields: `amount_original` (defaults to `amount_cad`), `currency_original` (defaults to `CAD`), `tags` (defaults to `[]`), `notes` (defaults to `null`).

Valid values for `category`: `tax-return`, `grant`, `salary`, `gift`, `other`.
Valid values for `scope`: `personal`, `freelance`.

**Response: 201 Created**

```json
{
  "income": { ... }
}
```

The full created AdHocIncome object is returned under the `income` key.

**Error responses**

| Status | When |
|---|---|
| 400 | A required field is missing or fails validation. |
| 500 | Failed to write the income file. |

---

## PM

### Projects

#### GET /api/projects

Returns a filtered list of projects.

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | Filter by project status. Accepted values: `active`, `on-hold`, `completed`, `archived`. |
| `project_type` | string | No | Filter by project type. Accepted values: `client`, `ovn`, `r&d`. |

**Response: 200 OK**

```json
{
  "projects": [
    {
      "id": "project-acme-platform",
      "type": "project",
      "title": "Acme Platform Rebuild",
      "project_type": "client",
      "status": "active",
      "opportunity_ref": "opportunity-acme-platform",
      "organization": "Acme Corp",
      "contacts": ["contact-jane-doe"],
      "external_refs": [
        {
          "system": "github",
          "id": "42",
          "url": "https://github.com/acme/platform/issues/42",
          "label": "Epic: Platform v2"
        }
      ],
      "tags": ["platform"],
      "created": "2026-01-10",
      "updated": "2026-04-20",
      "notes": "Migrating from legacy monolith."
    }
  ],
  "total": 1
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to read the projects data directory. |

---

#### POST /api/projects

Creates a new project.

**Request body**

```json
{
  "title": "Acme Platform Rebuild",
  "project_type": "client",
  "status": "active",
  "tags": ["platform"],
  "organization": "Acme Corp",
  "contacts": ["contact-jane-doe"],
  "opportunity_ref": "opportunity-acme-platform",
  "notes": "Migrating from legacy monolith."
}
```

Required fields: `title`, `project_type`, `status`, `tags`. All other fields are optional.

**Response: 201 Created**

```json
{
  "project": { ... }
}
```

The full created Project object is returned under the `project` key.

**Error responses**

| Status | When |
|---|---|
| 400 | A required field is missing or fails validation. |
| 500 | Failed to write the project file. |

---

#### GET /api/projects/[id]

Returns the full project record. The response is the Project object directly.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The project ID. |

**Response: 200 OK**

The full Project object as shown in the list response above.

**Error responses**

| Status | When |
|---|---|
| 404 | No project with the given ID exists. |

---

#### PATCH /api/projects/[id]

Partially updates a project.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The project ID to update. |

**Request body**

Any subset of writable Project fields. Example:

```json
{
  "status": "completed"
}
```

**Response: 200 OK**

```json
{
  "project": { ... }
}
```

The full updated Project object is returned under the `project` key.

**Error responses**

| Status | When |
|---|---|
| 404 | No project with the given ID exists. |
| 400 | A field value fails validation. |

---

#### POST /api/projects/[id]/raw

Overwrites the raw markdown source file for a project.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The project ID whose file will be overwritten. |

**Request body**

```json
{
  "content": "---\nid: project-acme-platform\n---\n\n## Brief\n\nProject overview."
}
```

**Response: 200 OK**

```json
{
  "success": true
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to write the file to disk. |

---

### Tasks

#### GET /api/tasks

Returns a filtered list of tasks.

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `project_id` | string | No | Filter to tasks belonging to this project ID. |
| `status` | string | No | Filter by task status. Accepted values: `todo`, `in-progress`, `done`, `blocked`. |

**Response: 200 OK**

```json
{
  "tasks": [
    {
      "id": "task-setup-ci-pipeline",
      "type": "task",
      "project_id": "project-acme-platform",
      "title": "Set up CI pipeline",
      "status": "todo",
      "priority": "high",
      "t_shirt_size": "M",
      "epic": "Infrastructure",
      "external_ref": {
        "system": "github",
        "id": "55",
        "url": "https://github.com/acme/platform/issues/55",
        "label": "CI: initial setup"
      },
      "relations": [
        {
          "type": "blocks",
          "task_id": "task-deploy-staging"
        }
      ],
      "time_logs": [],
      "tags": ["devops"],
      "created": "2026-02-01",
      "updated": "2026-04-10"
    }
  ],
  "total": 1
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to read the tasks data directory. |

---

#### POST /api/tasks

Creates a new task.

**Request body**

```json
{
  "project_id": "project-acme-platform",
  "title": "Set up CI pipeline",
  "status": "todo",
  "priority": "high",
  "t_shirt_size": "M",
  "epic": "Infrastructure",
  "tags": ["devops"]
}
```

Required fields: `project_id`, `title`, `status`, `priority`. All other fields are optional.

**Response: 201 Created**

```json
{
  "task": { ... }
}
```

The full created Task object is returned under the `task` key.

**Error responses**

| Status | When |
|---|---|
| 400 | A required field is missing or fails validation. |
| 500 | Failed to write the task file. |

---

#### GET /api/tasks/[id]

Returns the full task record. The response is the Task object directly.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The task ID. |

**Response: 200 OK**

The full Task object as shown in the list response above.

**Error responses**

| Status | When |
|---|---|
| 404 | No task with the given ID exists. |

---

#### PATCH /api/tasks/[id]

Partially updates a task.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The task ID to update. |

**Request body**

Any subset of writable Task fields. Example:

```json
{
  "status": "in-progress"
}
```

**Response: 200 OK**

```json
{
  "task": { ... }
}
```

The full updated Task object is returned under the `task` key.

**Error responses**

| Status | When |
|---|---|
| 404 | No task with the given ID exists. |
| 400 | A field value fails validation. |

---

#### POST /api/tasks/[id]/raw

Overwrites the raw markdown source file for a task.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The task ID whose file will be overwritten. |

**Request body**

```json
{
  "content": "---\nid: task-setup-ci-pipeline\n---\n\n## Acceptance criteria\n\n- Pipeline passes on main."
}
```

**Response: 200 OK**

```json
{
  "success": true
}
```

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to write the file to disk. |

---

#### POST /api/tasks/[id]/time-log

Appends a time log entry to a task. The entry is added to the task's `time_logs` array.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The task ID to log time against. |

**Request body**

```json
{
  "date": "2026-04-27",
  "hours": 2.5,
  "notes": "Configured GitHub Actions runner."
}
```

Required fields: `date`, `hours`. The `notes` field is optional. The server returns a 400 error if either required field is missing.

**Response: 200 OK**

```json
{
  "task": { ... }
}
```

The full updated Task object is returned, with the new entry appended to `time_logs`.

**Error responses**

| Status | When |
|---|---|
| 400 | `date` or `hours` is missing from the request body. |
| 404 | No task with the given ID exists. |

---

### Focus

#### GET /api/focus

Returns focus lists. The shape of the response depends on the `type` query parameter.

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `type` | string | No | If `focus-daily`, returns only daily lists. If `focus-week`, returns only weekly lists. If omitted, returns both daily and weekly lists together. |

**Response: 200 OK (with type=focus-daily or type=focus-week)**

```json
{
  "lists": [
    {
      "id": "focus-daily-2026-04-27",
      "type": "focus-daily",
      "date": "2026-04-27",
      "week": "2026-W17",
      "status": "active",
      "items": [
        {
          "id": "item-abc123",
          "text": "Write API documentation",
          "done": false,
          "in_progress": true,
          "linked_ref": "task-write-api-docs"
        }
      ],
      "carried_from": "focus-daily-2026-04-26",
      "created": "2026-04-27",
      "updated": "2026-04-27T09:00:00Z"
    }
  ]
}
```

Results are sorted by `date` or `week` descending (most recent first).

**Response: 200 OK (without type parameter)**

```json
{
  "daily": [ ... ],
  "weekly": [ ... ]
}
```

Both arrays contain the full FocusDaily and FocusWeek objects respectively, unsorted.

---

#### POST /api/focus

Creates a new focus list (either daily or weekly). The `type` field in the request body determines which kind is created.

**Request body: create a daily focus list**

```json
{
  "type": "focus-daily",
  "date": "2026-04-27",
  "week": "2026-W17",
  "items": [
    {
      "id": "item-abc123",
      "text": "Write API documentation",
      "done": false
    }
  ],
  "carried_from": "focus-daily-2026-04-26"
}
```

The `date` defaults to today if omitted. The `week` is computed from the date if omitted. The `items` array defaults to `[]` if omitted. The `carried_from` field is optional.

**Request body: create a weekly focus list**

```json
{
  "type": "focus-week",
  "week": "2026-W17",
  "items": [],
  "carried_from": "focus-week-2026-W16"
}
```

The `week` defaults to the current ISO week if omitted.

**Response: 200 OK**

```json
{
  "list": { ... }
}
```

The full created FocusDaily or FocusWeek object is returned under the `list` key.

**Error responses**

| Status | When |
|---|---|
| 400 | `type` is missing or not one of `focus-daily` or `focus-week`. |
| 500 | Failed to write the focus list file. |

---

#### GET /api/focus/[id]

Returns a single focus list by ID, including its markdown body content.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The focus list ID, e.g. `focus-daily-2026-04-27` or `focus-week-2026-W17`. |

**Response: 200 OK**

```json
{
  "list": {
    "id": "focus-daily-2026-04-27",
    "type": "focus-daily",
    "date": "2026-04-27",
    "status": "active",
    "items": [ ... ],
    "created": "2026-04-27",
    "updated": "2026-04-27T09:00:00Z"
  },
  "body": "\n## Intentions\n\nNotes from the morning session.\n"
}
```

The `body` field contains the raw markdown content below the frontmatter block.

**Error responses**

| Status | When |
|---|---|
| 404 | No focus list with the given ID exists. |

---

#### PATCH /api/focus/[id]

Partially updates a focus list.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The focus list ID to update. |

**Request body**

Any subset of writable FocusList fields. Example:

```json
{
  "status": "archived",
  "items": [
    {
      "id": "item-abc123",
      "text": "Write API documentation",
      "done": true
    }
  ]
}
```

**Response: 200 OK**

```json
{
  "list": { ... }
}
```

The full updated FocusList object is returned under the `list` key.

**Error responses**

| Status | When |
|---|---|
| 500 | Failed to update the focus list. |

---

#### GET /api/focus/unfinished

Returns unfinished focus items grouped by their source daily list, within a configurable look-back window. Items with `done: true` are excluded.

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `days` | number | No | Number of days to look back. Defaults to `7`. Ignored when `all=true`. |
| `all` | boolean | No | Pass `all=true` to return unfinished items across all daily lists regardless of age. |

**Response: 200 OK**

```json
{
  "groups": [
    {
      "date": "2026-04-26",
      "listId": "focus-daily-2026-04-26",
      "listStatus": "active",
      "items": [
        {
          "itemId": "item-xyz789",
          "text": "Review pull requests",
          "in_progress": false,
          "linked_ref": "project-acme-platform"
        }
      ]
    }
  ],
  "totalCount": 1,
  "windowDays": 7
}
```

Daily lists that have no unfinished items are omitted from `groups`. The `totalCount` is the sum of all unfinished items across all groups.

---

## Global

### Search

#### GET /api/search

Performs a full-text search across contacts, opportunities, organizations, invoices, projects, and tasks. Returns an empty `results` array if `q` is not provided.

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `q` | string | Yes | Search query string. Case-insensitive substring match. Returns empty results if omitted. |
| `type` | string | No | Restrict results to a single entity type. Accepted values: `contact`, `opportunity`, `organization`, `invoice`, `project`, `task`. |

**Search fields by entity type**

| Entity | Searched fields |
|---|---|
| contact | `name`, `organization`, `role`, `nickname`, `tags` |
| opportunity | `title`, `organization`, `description`, `tags` |
| organization | `name`, `domain`, `tags` |
| invoice | `number`, `organization`, `notes`, `tags` |
| project | `title`, `organization`, `notes`, `tags` |
| task | `title`, `epic`, `tags` |

**Response: 200 OK**

```json
{
  "results": [
    {
      "type": "contact",
      "id": "contact-jane-doe",
      "title": "Jane Doe",
      "excerpt": "Acme Corp"
    },
    {
      "type": "project",
      "id": "project-acme-platform",
      "title": "Acme Platform Rebuild",
      "excerpt": "Acme Corp"
    }
  ],
  "total": 2
}
```

The `excerpt` field contains a short text snippet from the matching entity content, with the matched term highlighted by surrounding context (up to 30 characters before and 40 characters after the match). Leading ellipsis is added when the excerpt is not from the beginning of the source string.

---

### Health

#### GET /api/health

Returns status information about the SQLite search index.

**Response: 200 OK**

```json
{
  "entity_count": 142,
  "by_type": [
    { "type": "task", "n": 55 },
    { "type": "contact", "n": 38 },
    { "type": "project", "n": 20 },
    { "type": "invoice", "n": 17 },
    { "type": "opportunity", "n": 8 },
    { "type": "organization", "n": 4 }
  ],
  "errors": [
    {
      "file_path": "/data/PM/tasks/task-broken.md",
      "error_type": "ParseError",
      "error_msg": "Invalid YAML frontmatter",
      "occurred_at": "2026-04-27T08:00:00Z"
    }
  ],
  "last_indexed": "2026-04-27T09:00:00Z"
}
```

The `by_type` array is sorted by count descending. The `errors` array contains up to 50 unresolved sync errors ordered by `occurred_at` descending. The `last_indexed` field is `null` if no entities have been indexed yet.

---

#### POST /api/health

Triggers a full rebuild of the SQLite search index. All entity files are re-parsed and the index is repopulated.

**Response: 200 OK**

```json
{
  "message": "Index rebuilt successfully"
}
```

Additional fields from the rebuild result may also be present depending on the sync engine implementation.

---

## ValueFlows

The ValueFlows endpoints expose views derived from the SQLite index. They reflect the ValueFlows 1.0 ontology, mapping entities and economic events tracked in the data layer to their VF counterparts.

### GET /api/vf/balance

Returns all agent contribution records and all claim status records from the index. This gives an overview of who has contributed what and the settlement state of any outstanding claims.

**Response: 200 OK**

```json
{
  "contributions": [
    {
      "agent_id": "contact-jane-doe",
      "total_qty": 120
    }
  ],
  "claims": [
    {
      "settlement_status": "pending",
      "agent_id": "contact-jane-doe",
      "claim_qty": 40
    }
  ]
}
```

The `contributions` array is sorted by `total_qty` descending. The `claims` array contains all claim status records. The exact columns in each row reflect the `vf_agent_contributions` and `vf_claim_status` SQLite view schemas.

---

### GET /api/vf/process/[id]/events

Returns all economic events associated with a specific process, ordered by `point_in_time` ascending.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The process ID to retrieve events for. |

**Response: 200 OK**

```json
{
  "events": [
    {
      "process_id": "project-acme-platform",
      "point_in_time": "2026-02-01T00:00:00Z",
      "action": "work",
      "qty": 8,
      "unit": "hours",
      "agent_id": "contact-jane-doe"
    }
  ],
  "process_id": "project-acme-platform",
  "total": 1
}
```

The exact columns in each event row reflect the `vf_process_flows` SQLite view schema.

---

### GET /api/vf/claims

Returns VF claim status records. An optional `status` filter is supported.

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | Filter claims by `settlement_status`. Example values: `pending`, `settled`. |

**Response: 200 OK**

```json
{
  "claims": [
    {
      "settlement_status": "pending",
      "agent_id": "contact-jane-doe",
      "claim_qty": 40
    }
  ],
  "total": 1
}
```

The exact columns in each claim row reflect the `vf_claim_status` SQLite view schema.

---

### GET /api/vf/agent/[id]/contributions

Returns all contribution records for a specific agent.

**Path parameters**

| Name | Description |
|---|---|
| `id` | The agent ID (typically a contact ID) to retrieve contributions for. |

**Response: 200 OK**

```json
{
  "contributions": [
    {
      "agent_id": "contact-jane-doe",
      "total_qty": 120
    }
  ],
  "agent_id": "contact-jane-doe"
}
```

The `contributions` array contains all rows from the `vf_agent_contributions` SQLite view where `agent_id` matches the path parameter.
