// ── CRM ──────────────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  type: "contact";
  name: string;
  nickname?: string;
  organization: string;
  role: string;
  tags: string[];
  status: "active" | "inactive" | "prospect";
  last_contact: string;
  created: string;
  email?: string;
  github?: string;
  timezone?: string;
}

export interface Opportunity {
  id: string;
  type: "opportunity";
  title: string;
  contact: string;
  organization: string;
  status: "prospect" | "active" | "won" | "lost" | "on-hold" | "archived";
  value_cad?: number;
  tags: string[];
  created: string;
  updated: string;
  description?: string;
}

export interface Organization {
  id: string;
  type: "organization";
  name: string;
  domain: string;
  address?: string;
  phone?: string;
  tags: string[];
  status: "active" | "inactive";
  created: string;
}

// ── ERP ──────────────────────────────────────────────────────────────────────

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  type: "invoice";
  number: string;
  contact?: string;
  organization: string;
  organization_id?: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  currency: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  opportunity?: string | null;
  tags: string[];
  line_items: LineItem[];
  subtotal: number;
  tax_rate?: number;
  tax_label?: string;
  tax_amount?: number;
  total: number;
  created: string;
  updated: string;
  notes?: string;
}

// ── PM ───────────────────────────────────────────────────────────────────────

export interface ExternalRef {
  system: "github" | "gitlab" | "tiki" | "other";
  id: string;
  url: string;
  label?: string;
}

export interface TimeLogEntry {
  date: string;
  hours: number;
  notes?: string;
}

export interface TaskRelation {
  type: "blocks" | "blocked-by" | "related";
  task_id: string;
}

export interface Project {
  id: string;
  type: "project";
  title: string;
  project_type: "client" | "ovn" | "r&d";
  status: "active" | "on-hold" | "completed" | "archived";
  opportunity_ref?: string;
  organization?: string;
  contacts?: string[];
  external_refs?: ExternalRef[];
  tags: string[];
  created: string;
  updated: string;
  notes?: string;
}

export interface Task {
  id: string;
  type: "task";
  project_id: string;
  title: string;
  status: "todo" | "in-progress" | "done" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  t_shirt_size?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  epic?: string;
  external_ref?: ExternalRef;
  relations?: TaskRelation[];
  time_logs?: TimeLogEntry[];
  tags?: string[];
  created: string;
  updated: string;
}

// ── ERP Finance ───────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'housing' | 'utilities' | 'subscriptions' | 'transport'
  | 'food' | 'health' | 'other'

export type ExpenseRecurrence = 'monthly' | 'annual' | 'one-time'

export interface Expense {
  id: string;
  type: 'expense';
  name: string;
  category: ExpenseCategory;
  scope: 'personal' | 'freelance' | 'mixed';
  recurrence: ExpenseRecurrence;
  status: 'active' | 'planned' | 'cancelled';
  amount_cad: number;
  amount_original: number;
  currency_original: 'CAD' | 'USD';
  billing_day?: number | null;
  next_due?: string | null;
  start_date: string;
  end_date?: string | null;
  tags: string[];
  notes?: string | null;
  created: string;
  updated: string;
}

export interface AdHocIncome {
  id: string;
  type: 'income';
  name: string;
  category: 'tax-return' | 'grant' | 'salary' | 'gift' | 'other';
  scope: 'personal' | 'freelance';
  amount_cad: number;
  amount_original: number;
  currency_original: 'CAD' | 'USD';
  date: string;
  tags: string[];
  notes?: string | null;
  created: string;
}

export interface Payment {
  id: string;
  type: 'payment';
  expense_id: string;
  date: string;
  amount_cad: number;
  amount_original: number;
  currency_original: 'CAD' | 'USD';
  notes?: string | null;
  tags: string[];
  created: string;
}

// ── Shared ────────────────────────────────────────────────────────────────────

export interface EntityWithBody<T> {
  data: T;
  body: string;
}

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  excerpt: string;
}
