// ── CRM ──────────────────────────────────────────────────────────────────────

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

// ── ERP ──────────────────────────────────────────────────────────────────────

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

// ── PM ───────────────────────────────────────────────────────────────────────

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

/** A single work session logged against a task. */
export interface TimeLogEntry {
  /** ISO date (YYYY-MM-DD) the work was performed. */
  date: string;
  /** Duration in decimal hours, e.g. 1.5 for 90 minutes. */
  hours: number;
  /** Optional description of the work done in this session. */
  notes?: string;
}

/** A directional relationship between two tasks. */
export interface TaskRelation {
  /** Relationship kind: blocks, blocked-by, or related. */
  type: "blocks" | "blocked-by" | "related";
  /** ID of the related task. */
  task_id: string;
}

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

// ── ERP Finance ───────────────────────────────────────────────────────────────

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
  currency_original: 'CAD' | 'USD';
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
  currency_original: 'CAD' | 'USD';
  /** ISO date (YYYY-MM-DD) the income was received. */
  date: string;
  /** Categorization labels. */
  tags: string[];
  /** Optional free-text notes. */
  notes?: string | null;
  /** ISO timestamp when the income record was created. */
  created: string;
}

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
  currency_original: 'CAD' | 'USD';
  /** Optional free-text notes about this payment. */
  notes?: string | null;
  /** Categorization labels. */
  tags: string[];
  /** ISO timestamp when the payment record was created. */
  created: string;
}

// ── PM / Focus ───────────────────────────────────────────────────────────────

/** A single focus objective within a daily or weekly list. */
export interface FocusItem {
  /** Unique identifier for this focus item. */
  id: string;
  /** Human-readable description of the objective. */
  text: string;
  /** Whether the item has been completed. */
  done: boolean;
  /** Optional reference to a linked entity (e.g. a task or project ID). */
  linked_ref?: string;
}

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

// ── Shared ────────────────────────────────────────────────────────────────────

/** Generic wrapper combining parsed frontmatter data with its markdown body text. */
export interface EntityWithBody<T> {
  /** Parsed frontmatter fields typed as T. */
  data: T;
  /** Raw markdown body content below the frontmatter block. */
  body: string;
}

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
