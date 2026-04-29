# DATA-MODEL

This document is the authoritative reference for every entity type in the pai-data-ui data layer. It covers TypeScript interfaces, the `DataError` union, file naming conventions, required frontmatter fields, the SQLite index schema, and the directories the sync engine never walks. For the sync engine itself (chokidar watcher, rebuild lifecycle, WAL configuration), see `documentation/ARCHITECTURE.md`.

All entity data lives in markdown files under `DATA_ROOT` (`$PAI_DATA_ROOT` or `~/.claude/PAI/USER/DATA`). YAML frontmatter carries the structured fields; everything below the frontmatter delimiter is the free-text `body`. The SQLite index at `$DATA_ROOT/_index/pai.db` is derived from those files and is rebuilt on server start.

---

## Entity Types by Domain

Interfaces are defined in `src/lib/data/types.ts`. Each section below reproduces the exact TypeScript source for each type, preserving JSDoc field comments as the canonical field-level documentation.

### CRM

The CRM domain (`DATA_ROOT/CRM/`) tracks people, companies, and sales pipeline entries.

#### Contact

A `Contact` represents a person. The `id` field follows the convention `contact-{slug}`, matching the file name without the `.md` extension.

```typescript
/** A CRM contact representing a person in the system. */
export interface Contact {
  /** Unique identifier derived from the contact name, e.g. "contact-jane-doe". */
  id: string;
  /** Discriminant for entity type narrowing. Always "contact". */
  type: "contact";
  /** Full display name. */
  name: string;
  /** Optional informal name used in conversation. */
  nickname?: string;
  /** Name of the associated organization. */
  organization: string;
  /** Job title or functional role. */
  role: string;
  /** Categorization labels. */
  tags: string[];
  /** Relationship status with this contact. */
  status: "active" | "inactive" | "prospect";
  /** ISO date (YYYY-MM-DD) of the most recent contact interaction. */
  last_contact: string;
  /** ISO date (YYYY-MM-DD) when the contact was created. */
  created: string;
  /** Optional email address. */
  email?: string;
  /** Optional GitHub username (without @). */
  github?: string;
  /** Optional IANA timezone identifier, e.g. "America/Montreal". */
  timezone?: string;
}
```

#### Organization

An `Organization` represents a company or external entity. Multiple contacts can reference the same organization by `name`.

```typescript
/** An organization (company or entity) tracked in the CRM. */
export interface Organization {
  /** Unique identifier for the organization. */
  id: string;
  /** Discriminant for entity type narrowing. Always "organization". */
  type: "organization";
  /** Official display name of the organization. */
  name: string;
  /** The company's web domain, e.g. "acme.com". */
  domain: string;
  /** Optional mailing or physical address. */
  address?: string;
  /** Optional contact phone number. */
  phone?: string;
  /** Categorization labels. */
  tags: string[];
  /** Whether the organization is currently active or inactive. */
  status: "active" | "inactive";
  /** ISO date (YYYY-MM-DD) when the organization was created. */
  created: string;
}
```

#### Opportunity

An `Opportunity` is a sales or partnership deal linked to a contact and organization. The `contact` field holds the contact's `id`; `organization` holds the display name.

```typescript
/** A sales or partnership opportunity linked to a contact and organization. */
export interface Opportunity {
  /** Unique identifier for the opportunity. */
  id: string;
  /** Discriminant for entity type narrowing. Always "opportunity". */
  type: "opportunity";
  /** Short descriptive title for the opportunity. */
  title: string;
  /** ID of the primary contact associated with this opportunity. */
  contact: string;
  /** Name of the organization this opportunity belongs to. */
  organization: string;
  /** Lifecycle stage: from initial prospect through active engagement to a final outcome or archival. */
  status: "prospect" | "active" | "won" | "lost" | "on-hold" | "archived";
  /** Estimated deal value in Canadian dollars. */
  value_cad?: number;
  /** Categorization labels. */
  tags: string[];
  /** ISO date (YYYY-MM-DD) when the opportunity was created. */
  created: string;
  /** ISO timestamp of the last modification. */
  updated: string;
  /** Optional free-text description of the opportunity. */
  description?: string;
}
```

---

### ERP

The ERP domain (`DATA_ROOT/ERP/`) manages invoices, tracked expenses, ad-hoc income, and payment records.

#### LineItem (sub-type)

`LineItem` is an embedded sub-type used inside `Invoice`. It is not stored as an independent entity file; it appears as an element of the `line_items` array in invoice frontmatter.

```typescript
/** A single line item on an invoice. */
export interface LineItem {
  /** Human-readable description of the product or service. */
  description: string;
  /** Number of units billed. */
  quantity: number;
  /** Price per unit in the invoice currency. */
  unit_price: number;
  /** Total amount for this line (should equal quantity × unit_price). */
  amount: number;
}
```

#### Invoice

An `Invoice` is a client billing document. The `number` field uses the sequential format `INxxxxxx`. The `subtotal` field is the sum of all `line_items[].amount` values before tax; `total` includes taxes.

```typescript
/** A client invoice with line items, taxes, and lifecycle status. */
export interface Invoice {
  /** Unique identifier for the invoice. */
  id: string;
  /** Discriminant for entity type narrowing. Always "invoice". */
  type: "invoice";
  /** Sequential invoice number in the format "INxxxxxx". */
  number: string;
  /** Optional ID of the primary contact for this invoice. */
  contact?: string;
  /** Display name of the billed organization. */
  organization: string;
  /** Optional ID of the billed organization entity. */
  organization_id?: string;
  /** Billing lifecycle stage: draft → sent → paid/overdue/cancelled. */
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  /** ISO 4217 currency code, e.g. "CAD". */
  currency: string;
  /** ISO date (YYYY-MM-DD) the invoice was issued. */
  issue_date: string;
  /** ISO date (YYYY-MM-DD) payment is due. */
  due_date: string;
  /** ISO date (YYYY-MM-DD) payment was received, or null if unpaid. */
  paid_date: string | null;
  /** Optional ID of the linked opportunity, or null. */
  opportunity?: string | null;
  /** Categorization labels. */
  tags: string[];
  /** Ordered list of billed line items. */
  line_items: LineItem[];
  /** Sum of all line item amounts before tax, in CAD. */
  subtotal: number;
  /** Optional tax rate as a decimal fraction, e.g. 0.15 for 15%. */
  tax_rate?: number;
  /** Optional display label for the tax, e.g. "QST+GST". */
  tax_label?: string;
  /** Optional computed tax amount in CAD. */
  tax_amount?: number;
  /** Grand total including taxes, in CAD. */
  total: number;
  /** ISO timestamp when the invoice was created. */
  created: string;
  /** ISO timestamp of the last modification. */
  updated: string;
  /** Optional free-text notes to include on the invoice. */
  notes?: string;
}
```

#### Expense

`ExpenseCategory` and `ExpenseRecurrence` are type aliases used as field types on `Expense`.

```typescript
/** Valid expense category identifiers. */
export type ExpenseCategory =
  | 'housing' | 'utilities' | 'subscriptions' | 'transport'
  | 'food' | 'health' | 'other'

/** Billing frequency for an expense. */
export type ExpenseRecurrence = 'monthly' | 'annual' | 'one-time'

/** A tracked recurring or one-time expense. */
export interface Expense {
  /** Unique identifier for the expense. */
  id: string;
  /** Discriminant for entity type narrowing. Always "expense". */
  type: 'expense';
  /** Human-readable name for the expense, e.g. "AWS Hosting". */
  name: string;
  /** Top-level category the expense belongs to. */
  category: ExpenseCategory;
  /** Whether this expense is personal, freelance-related, or mixed. */
  scope: 'personal' | 'freelance' | 'mixed';
  /** How often this expense recurs. */
  recurrence: ExpenseRecurrence;
  /** Lifecycle state of the expense. */
  status: 'active' | 'planned' | 'cancelled';
  /** Cost normalized to Canadian dollars (monthly or annual depending on recurrence). */
  amount_cad: number;
  /** Cost in the original billing currency. */
  amount_original: number;
  /** Currency of the original billing amount. */
  currency_original: 'CAD' | 'USD' | 'EUR';
  /** Day of the month on which recurring charges are billed (1–31), or null. */
  billing_day?: number | null;
  /** ISO date (YYYY-MM-DD) the next payment is due, or null. */
  next_due?: string | null;
  /** ISO date (YYYY-MM-DD) the expense began. */
  start_date: string;
  /** ISO date (YYYY-MM-DD) the expense ended or is scheduled to end, or null. */
  end_date?: string | null;
  /** Categorization labels. */
  tags: string[];
  /** Optional free-text notes. */
  notes?: string | null;
  /** ISO timestamp when the expense record was created. */
  created: string;
  /** ISO timestamp of the last modification. */
  updated: string;
}
```

#### AdHocIncome

`AdHocIncome` records a one-off income event not linked to an invoice, such as a tax return, grant, or gift. Its `type` discriminant is `"income"`.

```typescript
/** A one-off income entry not tied to an invoice. */
export interface AdHocIncome {
  /** Unique identifier for the income entry. */
  id: string;
  /** Discriminant for entity type narrowing. Always "income". */
  type: 'income';
  /** Human-readable name for the income source. */
  name: string;
  /** Classification of the income type. */
  category: 'tax-return' | 'grant' | 'salary' | 'gift' | 'other';
  /** Whether the income is personal or freelance: client/ovn/r&d. */
  scope: 'personal' | 'freelance';
  /** Amount received in Canadian dollars. */
  amount_cad: number;
  /** Amount in the original currency. */
  amount_original: number;
  /** Currency of the original amount. */
  currency_original: 'CAD' | 'USD' | 'EUR';
  /** ISO date (YYYY-MM-DD) the income was received. */
  date: string;
  /** Categorization labels. */
  tags: string[];
  /** Optional free-text notes. */
  notes?: string | null;
  /** ISO timestamp when the income record was created. */
  created: string;
}
```

#### Payment

A `Payment` records a single settlement of a recurring `Expense`. The `expense_id` field references the `id` of the parent `Expense` entity.

```typescript
/** A payment record settling a recurring expense. */
export interface Payment {
  /** Unique identifier for the payment. */
  id: string;
  /** Discriminant for entity type narrowing. Always "payment". */
  type: 'payment';
  /** ID of the expense this payment is settling. */
  expense_id: string;
  /** ISO date (YYYY-MM-DD) the payment was made. */
  date: string;
  /** Amount paid in Canadian dollars. */
  amount_cad: number;
  /** Amount in the original billing currency. */
  amount_original: number;
  /** Currency of the original payment. */
  currency_original: 'CAD' | 'USD' | 'EUR';
  /** Optional free-text notes about this payment. */
  notes?: string | null;
  /** Categorization labels. */
  tags: string[];
  /** ISO timestamp when the payment record was created. */
  created: string;
}
```

---

### PM

The PM domain (`DATA_ROOT/PM/`) manages projects, tasks, time logs, and focus lists.

#### ExternalRef (sub-type)

`ExternalRef` is an embedded sub-type used inside `Project` (as an array element) and `Task` (as a single field). It is not stored as an independent entity file.

```typescript
/** A reference to an external issue tracker entry. */
export interface ExternalRef {
  /** Platform type: github, gitlab, tiki, or other. */
  system: "github" | "gitlab" | "tiki" | "other";
  /** Issue number or URL slug in the external system. */
  id: string;
  /** Full URL linking directly to the external issue or item. */
  url: string;
  /** Optional human-readable label for display. */
  label?: string;
}
```

#### TimeLogEntry (sub-type)

`TimeLogEntry` records a single work session. It is embedded as an element of `Task.time_logs` and is not stored as an independent entity.

```typescript
/** A single work session logged against a task. */
export interface TimeLogEntry {
  /** ISO date (YYYY-MM-DD) the work was performed. */
  date: string;
  /** Duration in decimal hours, e.g. 1.5 for 90 minutes. */
  hours: number;
  /** Optional description of the work done in this session. */
  notes?: string;
}
```

#### TaskRelation (sub-type)

`TaskRelation` describes a directional dependency between two tasks. It is embedded in `Task.relations` and is not stored as an independent entity.

```typescript
/** A directional relationship between two tasks. */
export interface TaskRelation {
  /** Relationship kind: blocks, blocked-by, or related. */
  type: "blocks" | "blocked-by" | "related";
  /** ID of the related task. */
  task_id: string;
}
```

#### Project

A `Project` groups tasks under a client, OVN, or R&D context. The optional `opportunity_ref` field links back to the CRM opportunity that originated the project.

```typescript
/** A project grouping tasks under a client, OVN, or R&D context. */
export interface Project {
  /** Unique identifier for the project. */
  id: string;
  /** Discriminant for entity type narrowing. Always "project". */
  type: "project";
  /** Short descriptive title for the project. */
  title: string;
  /** Broad category: client work, open-value network, or internal R&D. */
  project_type: "client" | "ovn" | "r&d";
  /** Lifecycle stage: planning/active/on-hold/completed/archived. */
  status: "active" | "on-hold" | "completed" | "archived";
  /** Optional ID of the CRM opportunity that originated this project. */
  opportunity_ref?: string;
  /** Optional name of the associated organization. */
  organization?: string;
  /** Optional list of contact IDs involved in the project. */
  contacts?: string[];
  /** Optional links to external issue trackers or repositories. */
  external_refs?: ExternalRef[];
  /** Categorization labels. */
  tags: string[];
  /** ISO date (YYYY-MM-DD) when the project was created. */
  created: string;
  /** ISO timestamp of the last modification. */
  updated: string;
  /** Optional free-text notes about the project. */
  notes?: string;
}
```

#### Task

A `Task` is a single unit of work belonging to a project. It accumulates work sessions via `time_logs` and may carry directional dependencies via `relations`.

```typescript
/** A single unit of work belonging to a project. */
export interface Task {
  /** Unique identifier for the task. */
  id: string;
  /** Discriminant for entity type narrowing. Always "task". */
  type: "task";
  /** ID of the parent project this task belongs to. */
  project_id: string;
  /** Short descriptive title for the task. */
  title: string;
  /** Current workflow state of the task. */
  status: "todo" | "in-progress" | "done" | "blocked";
  /** Urgency and importance level: critical/high/medium/low. */
  priority: "low" | "medium" | "high" | "critical";
  /** Rough effort estimate using T-shirt sizing: XS/S/M/L/XL/XXL. */
  t_shirt_size?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  /** Optional epic or theme this task belongs to. */
  epic?: string;
  /** Optional single link to an external issue tracker entry. */
  external_ref?: ExternalRef;
  /** Optional directional relationships to other tasks. */
  relations?: TaskRelation[];
  /** Accumulated work sessions logged against this task. */
  time_logs?: TimeLogEntry[];
  /** Optional categorization labels. */
  tags?: string[];
  /** ISO date (YYYY-MM-DD) when the task was created. */
  created: string;
  /** ISO timestamp of the last modification. */
  updated: string;
}
```

#### FocusItem (sub-type)

`FocusItem` is a single objective within a daily or weekly focus list. It is embedded as an element of `FocusDaily.items` or `FocusWeek.items`.

```typescript
/** A single focus objective within a daily or weekly list. */
export interface FocusItem {
  /** Unique identifier for this focus item. */
  id: string;
  /** Human-readable description of the objective. */
  text: string;
  /** Whether the item has been completed. */
  done: boolean;
  /** Whether the item has been worked on but not yet completed. */
  in_progress?: boolean;
  /** Optional reference to a linked entity (e.g. a task or project ID). */
  linked_ref?: string;
}
```

#### FocusDaily

`FocusDaily` is the focus list for a single calendar day. Its `type` discriminant is `"focus-daily"`.

```typescript
/** A daily focus list containing objectives for a specific calendar day. */
export interface FocusDaily {
  /** Unique identifier for the daily list. */
  id: string;
  /** Discriminant for focus list type narrowing. Always "focus-daily". */
  type: "focus-daily";
  /** ISO date (YYYY-MM-DD) this list belongs to. */
  date: string;
  /** Optional ISO week identifier (YYYY-Www) this day falls within. */
  week?: string;
  /** Whether the list is currently active or has been archived. */
  status: "active" | "archived";
  /** Ordered list of focus objectives for the day. */
  items: FocusItem[];
  /** ID of the previous focus list from which items were carried over. */
  carried_from?: string;
  /** ISO timestamp when the list was created. */
  created: string;
  /** ISO timestamp of the last modification. */
  updated: string;
}
```

#### FocusWeek

`FocusWeek` is the focus list for an entire ISO week. Its `type` discriminant is `"focus-week"`. The `week` field uses ISO 8601 week notation, for example `"2026-W17"`.

```typescript
/** A weekly focus list containing objectives for an entire ISO week. */
export interface FocusWeek {
  /** Unique identifier for the weekly list. */
  id: string;
  /** Discriminant for focus list type narrowing. Always "focus-week". */
  type: "focus-week";
  /** ISO 8601 week identifier, e.g. "2026-W17". */
  week: string;
  /** Whether the list is currently active or has been archived. */
  status: "active" | "archived";
  /** Ordered list of focus objectives for the week. */
  items: FocusItem[];
  /** ID of the previous focus list from which items were carried over. */
  carried_from?: string;
  /** ISO timestamp when the list was created. */
  created: string;
  /** ISO timestamp of the last modification. */
  updated: string;
}

/** Discriminated union of all focus list variants. */
export type FocusList = FocusDaily | FocusWeek;
```

---

### Shared Types

These types are defined in `types.ts` and used across all domains.

#### EntityWithBody

`EntityWithBody<T>` is the generic wrapper returned by file-read operations. The `data` field holds the parsed frontmatter typed as `T`; the `body` field holds the raw markdown content below the frontmatter delimiter.

```typescript
/** Generic wrapper combining parsed frontmatter data with its markdown body text. */
export interface EntityWithBody<T> {
  /** Parsed frontmatter fields typed as T. */
  data: T;
  /** Raw markdown body content below the frontmatter block. */
  body: string;
}
```

#### SearchResult

`SearchResult` is the shape returned by full-text search queries against the SQLite FTS index.

```typescript
/** A search result entry pointing to a matching entity. */
export interface SearchResult {
  /** Entity type discriminant, e.g. "contact" or "project". */
  type: string;
  /** Unique identifier of the matching entity. */
  id: string;
  /** Display title of the matching entity. */
  title: string;
  /** Short text snippet from the entity content matching the query. */
  excerpt: string;
}
```

---

## DataError

`DataError` is a discriminated union of all error types that the data layer can raise. It is defined in `src/lib/data/errors.ts` using Effect's `Data.TaggedError` pattern. Every data layer function returns `Effect<T, DataError>`, and the `_tag` field on each error class is the discriminant used to narrow the variant in error-handling branches.

```typescript
/** Raised when a requested entity file does not exist on disk. */
export class FileNotFoundError extends Data.TaggedError("FileNotFoundError")<{
  /** ID of the entity that was not found. */
  id: string;
}> {}

/** Raised when a markdown file cannot be parsed (malformed YAML frontmatter or I/O error). */
export class ParseError extends Data.TaggedError("ParseError")<{
  /** Path to the file that failed to parse. */
  file: string;
  /** Underlying error from the filesystem or YAML parser. */
  cause: unknown;
}> {}

/** Raised when entity data fails validation rules. */
export class ValidationError extends Data.TaggedError("ValidationError")<{
  /** Name of the field that failed validation. */
  field: string;
  /** Human-readable validation failure message. */
  message: string;
}> {}

/** Raised when writing to a file fails (permissions, disk space, etc.). */
export class WriteError extends Data.TaggedError("WriteError")<{
  /** Path to the file that could not be written. */
  file: string;
  /** Underlying I/O error. */
  cause: unknown;
}> {}

/** Union of all possible data layer errors. Used as the error channel in Effect return types. */
export type DataError =
  | FileNotFoundError
  | ParseError
  | ValidationError
  | WriteError;
```

The four variants cover the full lifecycle of a file operation:

- `FileNotFoundError`: the requested `id` has no corresponding `.md` file on disk.
- `ParseError`: the file exists but its YAML frontmatter is malformed or the file cannot be read; the `cause` field carries the underlying exception.
- `ValidationError`: the frontmatter was parsed successfully but a field value fails a business rule; `field` names the offending field and `message` describes why.
- `WriteError`: a write operation (create or update) failed due to a filesystem-level condition such as missing permissions or a full disk; `cause` carries the underlying I/O exception.

---

## File Naming Conventions

Every entity file name follows a `{prefix}-{slug}.md` pattern. The prefix identifies the entity type; the slug is a kebab-case string derived from the entity's primary identifier or title. File names map directly to entity `id` values (without the `.md` extension).

| Domain | Pattern | Example |
|---|---|---|
| CRM contacts | `contact-{slug}.md` | `contact-jane-doe.md` |
| CRM opportunities | `opp-{slug}.md` | `opp-acme-2026.md` |
| CRM organizations | `org-{slug}.md` | `org-acme-corp.md` |
| ERP invoices | `inv-{slug}.md` | `inv-IN000042.md` |
| ERP expenses | `exp-{slug}.md` | `exp-aws-hosting.md` |
| ERP income | `income-{slug}.md` | `income-tax-return-2026.md` |
| ERP payments | `pay-{slug}.md` | `pay-aws-2026-04.md` |
| PM projects | `proj-{slug}.md` | `proj-acme-website.md` |
| PM tasks | `task-{slug}.md` | `task-setup-ci.md` |
| PM focus lists | `focus-{date}.md` | `focus-2026-04-26.md` |

---

## Required Frontmatter Fields

Every entity file must contain at minimum two frontmatter fields:

- `id` (string): the globally unique identifier for the entity. Must be unique across all domains, not just within a single domain folder. The value conventionally matches the file name without the `.md` extension.
- `type` (string): the type discriminant used to select the correct TypeScript interface at runtime (for example, `"contact"`, `"invoice"`, `"task"`, `"focus-daily"`).

If either field is absent or cannot be read when the sync engine processes a file, the engine does not add the entity to the `entities` table. Instead it writes a row to the `sync_errors` table recording the file path, the error type, and a raw excerpt of the problematic content. The entity will be invisible to all queries and the UI until the file is corrected and the sync engine re-processes it (either on the next file-change event or after a manual `bun rebuild-index` run).

---

## SQLite Index Schema

The index database lives at `$DATA_ROOT/_index/pai.db`. It is initialized by `src/lib/server/index-db.ts` on first access and uses WAL journal mode for concurrent read performance.

### entities table

The primary store for all indexed entities. Each row corresponds to one `.md` file.

```sql
CREATE TABLE IF NOT EXISTS entities (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  domain      TEXT NOT NULL,
  file_path   TEXT NOT NULL UNIQUE,
  data        TEXT NOT NULL,
  body        TEXT,
  updated     TEXT,
  indexed_at  INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_entities_type    ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_domain  ON entities(domain);
CREATE INDEX IF NOT EXISTS idx_entities_updated ON entities(updated DESC);
```

Column descriptions:

- `id`: the entity's `id` frontmatter value; primary key.
- `type`: the entity's `type` frontmatter value (for example, `"contact"` or `"invoice"`).
- `domain`: the first directory component below `DATA_ROOT` (for example, `"CRM"` or `"PM"`), derived at index time from the file path.
- `file_path`: absolute path to the source `.md` file; unique constraint prevents duplicate entries.
- `data`: the full YAML frontmatter serialized as a JSON string. Used by `json_extract()` queries.
- `body`: the markdown body text below the frontmatter delimiter, or `NULL` if the file has no body content.
- `updated`: the `updated` field from the entity's frontmatter (as an ISO timestamp string), or `NULL` if the entity has no `updated` field. Used for ordering results.
- `indexed_at`: Unix epoch timestamp recording when this row was last written.

### entities_fts virtual table

An FTS5 content table backed by `entities`. It enables full-text search across entity names, tags, and body text.

```sql
CREATE VIRTUAL TABLE IF NOT EXISTS entities_fts USING fts5(
  id     UNINDEXED,
  type   UNINDEXED,
  name,
  tags,
  body,
  content=entities,
  content_rowid=rowid
);
```

The `id` and `type` columns are marked `UNINDEXED` (carried through for retrieval but not tokenized). The `name` column is populated from `json_extract(data, '$.name')` falling back to `json_extract(data, '$.title')`. The `tags` column is populated from `json_extract(data, '$.tags')`. Three triggers (`entities_fts_insert`, `entities_fts_delete`, `entities_fts_update`) keep the FTS index in sync with the `entities` table automatically.

### sync_errors table

Records files that the sync engine could not process successfully. A row is written for each failure; when the underlying file is corrected and re-indexed (or deleted), the row's `resolved_at` timestamp is set.

```sql
CREATE TABLE IF NOT EXISTS sync_errors (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path   TEXT NOT NULL,
  error_type  TEXT NOT NULL,
  error_msg   TEXT NOT NULL,
  raw_excerpt TEXT,
  occurred_at INTEGER DEFAULT (unixepoch()),
  resolved_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sync_errors_path ON sync_errors(file_path);
```

Column descriptions:

- `file_path`: absolute path to the file that failed.
- `error_type`: short classification of the failure (for example, `"ParseError"` or `"MissingRequiredField"`).
- `error_msg`: human-readable description of what went wrong.
- `raw_excerpt`: optional snippet of the raw file content at the point of failure, useful for debugging frontmatter issues.
- `occurred_at`: Unix epoch timestamp when the error was recorded.
- `resolved_at`: Unix epoch timestamp when the error was resolved (file re-indexed or removed), or `NULL` if still unresolved.

---

## Skipped Directories

The sync engine never walks the following directory names, regardless of where they appear under `DATA_ROOT`:

- `_schemas`: JSON Schema files used for frontmatter validation.
- `_templates`: starter template files for new entities.
- `_index`: the SQLite database directory itself.
- `exports`: generated output files (PDF invoices, CSV exports).
- `context`: narrative or reference text files not intended as indexed entities.

Any directory with one of these names encountered during a recursive walk is skipped entirely, including its subdirectories.
