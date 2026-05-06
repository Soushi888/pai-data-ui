import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'

const DEMO_ROOT = path.join(import.meta.dir, '..', 'demo-data')
const clean = process.argv.includes('--clean')

if (clean) {
  const indexDir = path.join(DEMO_ROOT, '_index')
  if (fs.existsSync(indexDir)) {
    fs.rmSync(indexDir, { recursive: true, force: true })
    console.log('Cleared demo-data/_index/')
  }
}

function write(relPath: string, frontmatter: Record<string, unknown>, body = '') {
  const full = path.join(DEMO_ROOT, relPath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, matter.stringify(body, frontmatter))
}

function writeRaw(relPath: string, content: string) {
  const full = path.join(DEMO_ROOT, relPath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

// ─── CRM: Organizations ──────────────────────────────────────────────────────

write('CRM/org-lumina-studios.md', {
  id: 'org-lumina-studios',
  type: 'organization',
  name: 'Lumina Studios',
  domain: 'luminastudios.ca',
  address: '42 Saint-Denis St, Montreal, QC',
  tags: ['design', 'agency', 'client'],
  status: 'active',
  created: '2026-01-10',
}, 'Boutique brand and visual identity studio based in Montreal. Primary client for brand refresh and identity projects.')

write('CRM/org-verdant-systems.md', {
  id: 'org-verdant-systems',
  type: 'organization',
  name: 'Verdant Systems',
  domain: 'verdantsystems.io',
  tags: ['saas', 'tech', 'client'],
  status: 'active',
  created: '2026-01-15',
}, 'SaaS company building developer tooling for climate-tech startups. API integration project completed in Q1 2026.')

write('CRM/org-nocturne-collective.md', {
  id: 'org-nocturne-collective',
  type: 'organization',
  name: 'Nocturne Collective',
  domain: 'nocturnecollective.org',
  tags: ['collective', 'arts', 'prospect'],
  status: 'active',
  created: '2026-02-20',
}, 'Independent arts and events collective. Prospective consulting client for digital strategy and tooling.')

// ─── CRM: Contacts ───────────────────────────────────────────────────────────

write('CRM/contact-alice-fontaine.md', {
  id: 'contact-alice-fontaine',
  type: 'contact',
  name: 'Alice Fontaine',
  organization: 'Lumina Studios',
  role: 'Creative Director',
  tags: ['lumina', 'design', 'decision-maker'],
  status: 'active',
  last_contact: '2026-04-28',
  created: '2026-01-10',
  email: 'alice@luminastudios.ca',
  timezone: 'America/Montreal',
}, 'Primary contact at Lumina Studios. Drives all creative decisions on the brand refresh project. Prefers async communication via email.')

write('CRM/contact-ben-tremblay.md', {
  id: 'contact-ben-tremblay',
  type: 'contact',
  name: 'Ben Tremblay',
  organization: 'Verdant Systems',
  role: 'CTO',
  tags: ['verdant', 'technical', 'api'],
  status: 'active',
  last_contact: '2026-03-10',
  created: '2026-01-15',
  email: 'ben@verdantsystems.io',
  github: 'btremblay',
  timezone: 'America/Toronto',
}, 'CTO at Verdant Systems. Led the API integration project. Technical stakeholder for any future engagement.')

write('CRM/contact-claire-osei.md', {
  id: 'contact-claire-osei',
  type: 'contact',
  name: 'Claire Osei',
  organization: 'Nocturne Collective',
  role: 'Founder',
  tags: ['nocturne', 'arts', 'founder'],
  status: 'active',
  last_contact: '2026-04-15',
  created: '2026-02-20',
  email: 'claire@nocturnecollective.org',
  timezone: 'America/Montreal',
}, 'Founder of Nocturne Collective. Exploring digital strategy consulting for 2026 season planning.')

write('CRM/contact-daniel-ruiz.md', {
  id: 'contact-daniel-ruiz',
  type: 'contact',
  name: 'Daniel Ruiz',
  organization: 'Lumina Studios',
  role: 'Project Manager',
  tags: ['lumina', 'pm', 'operations'],
  status: 'prospect',
  last_contact: '2026-04-01',
  created: '2026-03-05',
  email: 'daniel@luminastudios.ca',
  timezone: 'America/Montreal',
}, 'Project manager at Lumina Studios. Day-to-day coordination contact for deliverables and timelines.')

write('CRM/contact-emilie-parent.md', {
  id: 'contact-emilie-parent',
  type: 'contact',
  name: 'Emilie Parent',
  organization: 'Freelance',
  role: 'Copywriter',
  tags: ['copywriting', 'freelance', 'collaborator'],
  status: 'inactive',
  last_contact: '2026-02-01',
  created: '2026-01-20',
  email: 'emilie.parent@proton.me',
  timezone: 'America/Montreal',
}, 'Freelance copywriter. Collaborated on Lumina brand voice project. Currently inactive.')

// ─── CRM: Opportunities ──────────────────────────────────────────────────────

write('CRM/opp-lumina-brand-refresh.md', {
  id: 'opp-lumina-brand-refresh',
  type: 'opportunity',
  title: 'Lumina Studios — Brand Refresh',
  contact: 'contact-alice-fontaine',
  organization: 'Lumina Studios',
  status: 'active',
  value_cad: 12000,
  tags: ['lumina', 'design', 'brand'],
  created: '2026-01-10',
  updated: '2026-04-28',
  description: 'Full brand identity refresh: logo, visual system, typography, and brand guidelines. Deliverables in three phases over Q1-Q2 2026.',
})

write('CRM/opp-verdant-api-integration.md', {
  id: 'opp-verdant-api-integration',
  type: 'opportunity',
  title: 'Verdant Systems — API Integration',
  contact: 'contact-ben-tremblay',
  organization: 'Verdant Systems',
  status: 'won',
  value_cad: 8500,
  tags: ['verdant', 'api', 'integration'],
  created: '2026-01-15',
  updated: '2026-03-10',
  description: 'Design and implementation of third-party API integration layer for Verdant dashboard. Completed March 2026.',
})

write('CRM/opp-nocturne-consulting.md', {
  id: 'opp-nocturne-consulting',
  type: 'opportunity',
  title: 'Nocturne Collective — Digital Strategy',
  contact: 'contact-claire-osei',
  organization: 'Nocturne Collective',
  status: 'prospect',
  value_cad: 4000,
  tags: ['nocturne', 'strategy', 'consulting'],
  created: '2026-02-20',
  updated: '2026-04-15',
  description: 'Digital strategy consulting for 2026 season: tooling, communications, and online presence.',
})

// ─── ERP: Invoices ───────────────────────────────────────────────────────────

write('ERP/inv-IN000001.md', {
  id: 'inv-IN000001',
  type: 'invoice',
  number: 'IN000001',
  contact: 'contact-alice-fontaine',
  organization: 'Lumina Studios',
  organization_id: 'org-lumina-studios',
  status: 'paid',
  currency: 'CAD',
  issue_date: '2026-02-01',
  due_date: '2026-02-15',
  paid_date: '2026-02-12',
  opportunity: 'opp-lumina-brand-refresh',
  vf_resource_quantity: { numericValue: 6093.68, unit: 'CAD' },
  vf_settled_by: ['evt-lumina-IN000001-settled'],
  tags: ['lumina', 'brand-refresh', 'phase-1'],
  line_items: [
    { description: 'Brand Discovery and Strategy', quantity: 1, unit_price: 3000, amount: 3000 },
    { description: 'Logo Concepts (3 directions)', quantity: 1, unit_price: 2300, amount: 2300 },
  ],
  subtotal: 5300,
  tax_rate: 0.14975,
  tax_label: 'QST+GST',
  tax_amount: 793.68,
  total: 6093.68,
  created: '2026-02-01',
  updated: '2026-02-12',
  notes: 'Phase 1 of 3. Net 14 days.',
}, '## Invoice Notes\n\nPhase 1 delivery: discovery workshop, brand strategy deck, and 3 logo concept directions.')

write('ERP/inv-IN000002.md', {
  id: 'inv-IN000002',
  type: 'invoice',
  number: 'IN000002',
  contact: 'contact-ben-tremblay',
  organization: 'Verdant Systems',
  organization_id: 'org-verdant-systems',
  status: 'paid',
  currency: 'CAD',
  issue_date: '2026-03-10',
  due_date: '2026-03-24',
  paid_date: '2026-05-01',
  opportunity: 'opp-verdant-api-integration',
  vf_resource_quantity: { numericValue: 8500, unit: 'CAD' },
  vf_settled_by: ['evt-verdant-IN000002-settled'],
  tags: ['verdant', 'api', 'final'],
  line_items: [
    { description: 'API Integration Design and Implementation', quantity: 1, unit_price: 8500, amount: 8500 },
  ],
  subtotal: 8500,
  total: 8500,
  created: '2026-03-10',
  updated: '2026-05-01',
  notes: 'Final invoice. Paid 2026-05-01.',
})

write('ERP/inv-IN000003.md', {
  id: 'inv-IN000003',
  type: 'invoice',
  number: 'IN000003',
  contact: 'contact-alice-fontaine',
  organization: 'Lumina Studios',
  organization_id: 'org-lumina-studios',
  status: 'draft',
  currency: 'CAD',
  issue_date: '2026-04-28',
  due_date: '2026-05-12',
  paid_date: null,
  opportunity: 'opp-lumina-brand-refresh',
  vf_resource_quantity: { numericValue: 5748.75, unit: 'CAD' },
  tags: ['lumina', 'brand-refresh', 'phase-2'],
  line_items: [
    { description: 'Visual Identity System', quantity: 1, unit_price: 3500, amount: 3500 },
    { description: 'Typography and Colour Guidelines', quantity: 1, unit_price: 1500, amount: 1500 },
  ],
  subtotal: 5000,
  tax_rate: 0.14975,
  tax_label: 'QST+GST',
  tax_amount: 748.75,
  total: 5748.75,
  created: '2026-04-28',
  updated: '2026-04-28',
  notes: 'Phase 2 of 3. Draft — pending final review before sending.',
})

write('ERP/inv-IN000004.md', {
  id: 'inv-IN000004',
  type: 'invoice',
  number: 'IN000004',
  contact: 'contact-claire-osei',
  organization: 'Nocturne Collective',
  organization_id: 'org-nocturne-collective',
  status: 'overdue',
  currency: 'CAD',
  issue_date: '2026-03-01',
  due_date: '2026-03-15',
  paid_date: null,
  opportunity: null,
  vf_resource_quantity: { numericValue: 2000, unit: 'CAD' },
  tags: ['nocturne', 'consulting', 'overdue'],
  line_items: [
    { description: 'Digital Strategy Workshop', quantity: 1, unit_price: 2000, amount: 2000 },
  ],
  subtotal: 2000,
  total: 2000,
  created: '2026-03-01',
  updated: '2026-04-01',
  notes: 'Overdue 30+ days. Follow up with Claire.',
})

// ─── ERP: Expenses ───────────────────────────────────────────────────────────

write('ERP/exp-aws-hosting.md', {
  id: 'exp-aws-hosting',
  type: 'expense',
  name: 'AWS Hosting',
  category: 'subscriptions',
  scope: 'freelance',
  recurrence: 'monthly',
  status: 'active',
  amount_cad: 62,
  amount_original: 45,
  currency_original: 'USD',
  billing_day: 1,
  next_due: '2026-05-01',
  start_date: '2025-01-01',
  tags: ['aws', 'infrastructure', 'hosting'],
  created: '2026-01-01',
  updated: '2026-04-01',
})

write('ERP/exp-github-copilot.md', {
  id: 'exp-github-copilot',
  type: 'expense',
  name: 'GitHub Copilot',
  category: 'subscriptions',
  scope: 'freelance',
  recurrence: 'monthly',
  status: 'active',
  amount_cad: 14,
  amount_original: 10,
  currency_original: 'USD',
  billing_day: 15,
  next_due: '2026-05-15',
  start_date: '2025-06-01',
  tags: ['github', 'ai', 'dev-tools'],
  created: '2026-01-01',
  updated: '2026-01-01',
})

write('ERP/exp-office-rent.md', {
  id: 'exp-office-rent',
  type: 'expense',
  name: 'Office Rent (Coworking)',
  category: 'housing',
  scope: 'mixed',
  recurrence: 'monthly',
  status: 'active',
  amount_cad: 400,
  amount_original: 400,
  currency_original: 'CAD',
  billing_day: 1,
  next_due: '2026-05-01',
  start_date: '2025-09-01',
  tags: ['coworking', 'office', 'rent'],
  created: '2026-01-01',
  updated: '2026-01-01',
})

write('ERP/exp-adobe-cc.md', {
  id: 'exp-adobe-cc',
  type: 'expense',
  name: 'Adobe Creative Cloud',
  category: 'subscriptions',
  scope: 'freelance',
  recurrence: 'annual',
  status: 'active',
  amount_cad: 660,
  amount_original: 660,
  currency_original: 'CAD',
  billing_day: null,
  next_due: '2026-11-01',
  start_date: '2025-11-01',
  tags: ['adobe', 'design', 'annual'],
  created: '2026-01-01',
  updated: '2026-01-01',
})

write('ERP/exp-accountant-fee.md', {
  id: 'exp-accountant-fee',
  type: 'expense',
  name: 'Accountant Fee (Tax Season)',
  category: 'other',
  scope: 'mixed',
  recurrence: 'one-time',
  status: 'active',
  amount_cad: 750,
  amount_original: 750,
  currency_original: 'CAD',
  billing_day: null,
  next_due: null,
  start_date: '2026-03-01',
  tags: ['accountant', 'taxes', 'one-time'],
  created: '2026-03-01',
  updated: '2026-03-01',
  notes: 'Annual tax filing fee for 2025 fiscal year.',
})

// ─── ERP: Income ─────────────────────────────────────────────────────────────

write('ERP/income-tax-return-2025.md', {
  id: 'income-tax-return-2025',
  type: 'income',
  name: 'Tax Return 2025',
  category: 'tax-return',
  scope: 'personal',
  amount_cad: 3200,
  amount_original: 3200,
  currency_original: 'CAD',
  date: '2026-03-15',
  tags: ['tax', 'government', 'annual'],
  created: '2026-03-15',
})

write('ERP/income-grant-cnc.md', {
  id: 'income-grant-cnc',
  type: 'income',
  name: 'CNC Digital Arts Grant',
  category: 'grant',
  scope: 'freelance',
  amount_cad: 5000,
  amount_original: 5000,
  currency_original: 'CAD',
  date: '2026-01-20',
  tags: ['grant', 'cnc', 'arts'],
  created: '2026-01-20',
  notes: 'Canada Council for the Arts — digital arts development grant.',
})

// ─── ERP: Payments ───────────────────────────────────────────────────────────

write('ERP/pay-aws-2026-01.md', {
  id: 'pay-aws-2026-01',
  type: 'payment',
  expense_id: 'exp-aws-hosting',
  date: '2026-01-01',
  amount_cad: 62,
  amount_original: 45,
  currency_original: 'USD',
  tags: ['aws', 'hosting'],
  created: '2026-01-01',
})

write('ERP/pay-aws-2026-02.md', {
  id: 'pay-aws-2026-02',
  type: 'payment',
  expense_id: 'exp-aws-hosting',
  date: '2026-02-01',
  amount_cad: 62,
  amount_original: 45,
  currency_original: 'USD',
  tags: ['aws', 'hosting'],
  created: '2026-02-01',
})

write('ERP/pay-aws-2026-03.md', {
  id: 'pay-aws-2026-03',
  type: 'payment',
  expense_id: 'exp-aws-hosting',
  date: '2026-03-01',
  amount_cad: 62,
  amount_original: 45,
  currency_original: 'USD',
  tags: ['aws', 'hosting'],
  created: '2026-03-01',
})

write('ERP/pay-github-2026-01.md', {
  id: 'pay-github-2026-01',
  type: 'payment',
  expense_id: 'exp-github-copilot',
  date: '2026-01-15',
  amount_cad: 14,
  amount_original: 10,
  currency_original: 'USD',
  tags: ['github', 'dev-tools'],
  created: '2026-01-15',
})

write('ERP/pay-verdant-2026-05.md', {
  id: 'pay-verdant-2026-05',
  type: 'payment',
  expense_id: 'inv-IN000002',
  date: '2026-05-01',
  amount_cad: 8500,
  amount_original: 8500,
  currency_original: 'CAD',
  tags: ['verdant', 'invoice-payment'],
  created: '2026-05-01',
})

// ─── PM: Projects ─────────────────────────────────────────────────────────────

write('PM/proj-lumina-brand-refresh.md', {
  id: 'proj-lumina-brand-refresh',
  type: 'project',
  title: 'Lumina Studios Brand Refresh',
  project_type: 'client',
  status: 'active',
  opportunity_ref: 'opp-lumina-brand-refresh',
  organization: 'Lumina Studios',
  contacts: ['contact-alice-fontaine', 'contact-daniel-ruiz'],
  tags: ['lumina', 'brand', 'design'],
  created: '2026-02-01',
  updated: '2026-04-28',
  notes: 'Three-phase brand identity project. Phase 1 delivered and invoiced. Phase 2 in progress.',
}, '## Overview\n\nFull visual identity refresh for Lumina Studios. Covers logo, colour system, typography, and brand guidelines.\n\n## Phases\n\n- Phase 1: Discovery and logo concepts (complete)\n- Phase 2: Visual identity system (in progress)\n- Phase 3: Brand guidelines document (planned)')

write('PM/proj-pai-data-ui.md', {
  id: 'proj-pai-data-ui',
  type: 'project',
  title: 'PAI Data UI',
  project_type: 'r&d',
  status: 'active',
  tags: ['pai', 'sveltekit', 'r&d', 'tooling'],
  created: '2026-01-15',
  updated: '2026-04-30',
  notes: 'SvelteKit UI over PAI markdown data layer. Personal tooling project.',
}, '## Overview\n\nLocal web application that surfaces PAI CLI data (CRM, ERP, Projects, Focus) through a browser interface. SQLite FTS index, Svelte 5 runes, Effect TS error handling.\n\n## Goals\n\n- Full CRUD for all PAI domains\n- ERP stats and PDF invoice export\n- Demo DataLayer for screencasts')

// ─── PM: Tasks ────────────────────────────────────────────────────────────────

write('PM/task-lumina-01-discovery.md', {
  id: 'task-lumina-01-discovery',
  type: 'task',
  project_id: 'proj-lumina-brand-refresh',
  title: 'Brand Discovery Workshop',
  status: 'done',
  priority: 'high',
  t_shirt_size: 'M',
  epic: 'Phase 1',
  tags: ['lumina', 'discovery'],
  time_logs: [
    { date: '2026-02-03', hours: 3, notes: 'Discovery workshop with Alice' },
    { date: '2026-02-05', hours: 2, notes: 'Strategy deck write-up' },
  ],
  created: '2026-02-01',
  updated: '2026-02-05',
})

write('PM/task-lumina-02-wireframes.md', {
  id: 'task-lumina-02-wireframes',
  type: 'task',
  project_id: 'proj-lumina-brand-refresh',
  title: 'Visual Identity System',
  status: 'in-progress',
  priority: 'high',
  t_shirt_size: 'L',
  epic: 'Phase 2',
  tags: ['lumina', 'design', 'visual-identity'],
  time_logs: [
    { date: '2026-04-14', hours: 4, notes: 'Colour system exploration' },
    { date: '2026-04-21', hours: 3.5, notes: 'Typography pairing' },
  ],
  created: '2026-04-10',
  updated: '2026-04-21',
})

write('PM/task-lumina-03-delivery.md', {
  id: 'task-lumina-03-delivery',
  type: 'task',
  project_id: 'proj-lumina-brand-refresh',
  title: 'Brand Guidelines Document',
  status: 'todo',
  priority: 'medium',
  t_shirt_size: 'M',
  epic: 'Phase 3',
  tags: ['lumina', 'guidelines', 'documentation'],
  time_logs: [],
  created: '2026-04-10',
  updated: '2026-04-10',
})

write('PM/task-pdu-01-sqlite-index.md', {
  id: 'task-pdu-01-sqlite-index',
  type: 'task',
  project_id: 'proj-pai-data-ui',
  title: 'SQLite FTS Index and Sync Engine',
  status: 'done',
  priority: 'critical',
  t_shirt_size: 'L',
  epic: 'Core Infrastructure',
  tags: ['sqlite', 'fts', 'sync'],
  time_logs: [
    { date: '2026-01-20', hours: 6, notes: 'Index schema and sync engine' },
    { date: '2026-01-22', hours: 4, notes: 'Chokidar watcher integration' },
  ],
  created: '2026-01-15',
  updated: '2026-01-22',
})

write('PM/task-pdu-02-erp-stats.md', {
  id: 'task-pdu-02-erp-stats',
  type: 'task',
  project_id: 'proj-pai-data-ui',
  title: 'ERP Stats Page with D3 Charts',
  status: 'in-progress',
  priority: 'high',
  t_shirt_size: 'M',
  epic: 'ERP Domain',
  tags: ['erp', 'd3', 'charts', 'stats'],
  time_logs: [
    { date: '2026-04-25', hours: 3, notes: 'Income vs expenses chart' },
  ],
  created: '2026-04-20',
  updated: '2026-04-25',
})

write('PM/task-pdu-03-pdf-export.md', {
  id: 'task-pdu-03-pdf-export',
  type: 'task',
  project_id: 'proj-pai-data-ui',
  title: 'Invoice PDF Export',
  status: 'todo',
  priority: 'medium',
  t_shirt_size: 'S',
  epic: 'ERP Domain',
  tags: ['erp', 'pdf', 'invoice', 'export'],
  time_logs: [],
  created: '2026-04-20',
  updated: '2026-04-20',
})

// ─── PM: Focus Lists ──────────────────────────────────────────────────────────

write('PM/focus/focus-daily-2026-04-28.md', {
  id: 'focus-daily-2026-04-28',
  type: 'focus-daily',
  date: '2026-04-28',
  week: '2026-W18',
  status: 'archived',
  items: [
    { id: 'fi-428-1', text: 'Send Phase 2 invoice draft to Alice', done: true },
    { id: 'fi-428-2', text: 'Continue visual identity colour system', done: true },
    { id: 'fi-428-3', text: 'Check in with Daniel on timeline', done: true },
  ],
  created: '2026-04-28',
  updated: '2026-04-28',
})

write('PM/focus/focus-daily-2026-04-29.md', {
  id: 'focus-daily-2026-04-29',
  type: 'focus-daily',
  date: '2026-04-29',
  week: '2026-W18',
  status: 'archived',
  items: [
    { id: 'fi-429-1', text: 'Typography pairing exploration for Lumina', done: true },
    { id: 'fi-429-2', text: 'PAI Data UI: ERP stats income chart', done: true },
    { id: 'fi-429-3', text: 'Review Nocturne invoice follow-up email', done: true },
  ],
  created: '2026-04-29',
  updated: '2026-04-29',
})

write('PM/focus/focus-daily-2026-04-30.md', {
  id: 'focus-daily-2026-04-30',
  type: 'focus-daily',
  date: '2026-04-30',
  week: '2026-W18',
  status: 'active',
  items: [
    { id: 'fi-430-1', text: 'Finalize visual identity mockups for Lumina', done: true },
    { id: 'fi-430-2', text: 'PAI Data UI: demo DataLayer seeder script', done: false, in_progress: true },
    { id: 'fi-430-3', text: 'Plan Phase 3 scope with Alice', done: false },
  ],
  created: '2026-04-30',
  updated: '2026-04-30',
})

write('PM/focus/focus-week-2026-W18.md', {
  id: 'focus-week-2026-W18',
  type: 'focus-week',
  week: '2026-W18',
  status: 'archived',
  items: [
    { id: 'fw-w18-1', text: 'Deliver Phase 2 visual identity to Lumina', done: false, in_progress: true },
    { id: 'fw-w18-2', text: 'Complete PAI Data UI demo DataLayer', done: false },
    { id: 'fw-w18-3', text: 'Follow up on overdue Nocturne invoice', done: false },
    { id: 'fw-w18-4', text: 'Plan Q2 project pipeline review', done: false },
  ],
  created: '2026-04-28',
  updated: '2026-04-30',
})

write('PM/focus/focus-daily-2026-05-04.md', {
  id: 'focus-daily-2026-05-04',
  type: 'focus-daily',
  date: '2026-05-04',
  week: '2026-W19',
  status: 'active',
  items: [
    { id: 'fi-504-1', text: 'Review Phase 2 Lumina mockups with Alice', done: false, in_progress: true },
    { id: 'fi-504-2', text: 'Send IN000002 payment follow-up to Ben', done: false },
    { id: 'fi-504-3', text: 'Finalize Phase 3 scope proposal', done: false },
  ],
  created: '2026-05-04',
  updated: '2026-05-04',
})

write('PM/focus/focus-week-2026-W19.md', {
  id: 'focus-week-2026-W19',
  type: 'focus-week',
  week: '2026-W19',
  status: 'active',
  items: [
    { id: 'fw-w19-1', text: 'Close out Lumina Phase 2 and send invoice', done: false, in_progress: true },
    { id: 'fw-w19-2', text: 'Collect Verdant payment and settle IN000002', done: false },
    { id: 'fw-w19-3', text: 'Nocturne follow-up — second notice for IN000004', done: false },
    { id: 'fw-w19-4', text: 'Begin Phase 3 brand guidelines document', done: false },
  ],
  created: '2026-05-04',
  updated: '2026-05-04',
})

// ─── VF: Resource Specs ───────────────────────────────────────────────────────

write('VF/resource-specs/rspec-hours.md', {
  id: 'rspec-hours',
  type: 'resource-spec',
  name: 'Labour Hours',
  unit: 'hours',
  created: '2026-01-01',
}, 'Standard unit for tracking creative and technical labour.')

write('VF/resource-specs/rspec-cad.md', {
  id: 'rspec-cad',
  type: 'resource-spec',
  name: 'Canadian Dollar',
  unit: 'CAD',
  created: '2026-01-01',
}, 'Canadian dollar currency unit for financial flows.')

// ─── VF: Work Events ─────────────────────────────────────────────────────────

write('VF/work/evt-lumina-discovery.md', {
  id: 'evt-lumina-discovery',
  type: 'economic-event',
  title: 'Lumina — Brand Discovery Work',
  vf_action: 'work',
  vf_provider: 'agent-soushi',
  vf_receiver: 'org-lumina-studios',
  vf_input_of: 'proj-lumina-brand-refresh',
  vf_resource_conforms_to: 'rspec-hours',
  vf_resource_quantity: { numericValue: 5, unit: 'hours' },
  vf_has_point_in_time: '2026-02-05T00:00:00Z',
  tags: ['lumina', 'discovery', 'phase-1'],
  created: '2026-02-05',
})

write('VF/work/evt-lumina-visid.md', {
  id: 'evt-lumina-visid',
  type: 'economic-event',
  title: 'Lumina — Visual Identity Work',
  vf_action: 'work',
  vf_provider: 'agent-soushi',
  vf_receiver: 'org-lumina-studios',
  vf_input_of: 'proj-lumina-brand-refresh',
  vf_resource_conforms_to: 'rspec-hours',
  vf_resource_quantity: { numericValue: 7.5, unit: 'hours' },
  vf_has_point_in_time: '2026-04-21T00:00:00Z',
  tags: ['lumina', 'visual-identity', 'phase-2'],
  created: '2026-04-21',
})

write('VF/work/evt-verdant-api.md', {
  id: 'evt-verdant-api',
  type: 'economic-event',
  title: 'Verdant — API Integration Work',
  vf_action: 'deliver-service',
  vf_provider: 'agent-soushi',
  vf_receiver: 'org-verdant-systems',
  vf_input_of: 'proj-lumina-brand-refresh',
  vf_resource_conforms_to: 'rspec-hours',
  vf_resource_quantity: { numericValue: 40, unit: 'hours' },
  vf_has_point_in_time: '2026-03-10T00:00:00Z',
  tags: ['verdant', 'api', 'integration'],
  created: '2026-03-10',
})

// ─── VF: Payment Events ───────────────────────────────────────────────────────

write('VF/payments/evt-lumina-IN000001-settled.md', {
  id: 'evt-lumina-IN000001-settled',
  type: 'economic-event',
  title: 'Payment — IN000001 — Lumina Studios',
  vf_action: 'transfer',
  vf_provider: 'org-lumina-studios',
  vf_receiver: 'agent-soushi',
  vf_settles: ['inv-IN000001'],
  vf_resource_conforms_to: 'rspec-cad',
  vf_resource_quantity: { numericValue: 6093.68, unit: 'CAD' },
  vf_has_point_in_time: '2026-02-12T00:00:00Z',
  tags: ['lumina', 'payment', 'settled'],
  created: '2026-02-12',
})

write('VF/payments/evt-verdant-IN000002-settled.md', {
  id: 'evt-verdant-IN000002-settled',
  type: 'economic-event',
  title: 'Payment — IN000002 — Verdant Systems',
  vf_action: 'transfer',
  vf_provider: 'org-verdant-systems',
  vf_receiver: 'agent-soushi',
  vf_settles: ['inv-IN000002'],
  vf_resource_conforms_to: 'rspec-cad',
  vf_resource_quantity: { numericValue: 8500, unit: 'CAD' },
  vf_has_point_in_time: '2026-05-01T00:00:00Z',
  tags: ['verdant', 'payment', 'settled'],
  created: '2026-05-01',
})

// ─── Done ─────────────────────────────────────────────────────────────────────

// ─── TELOS ────────────────────────────────────────────────────────────────────

writeRaw('TELOS/TELOS.md', `# TELOS: Life Operating System

> Navigation index. Content lives in the files below.
> This file is a map, not a territory — do not add content here, add it to the specific files.

---

## Identity & Purpose (ALCHEMY Layer)

- \`ALCHEMY/SULPHUR.md\` — The Essential Fire: what I pursue regardless of the tools
- \`ALCHEMY/GREAT_WORK.md\` — The macrocosmic vision: Nigredo, Albedo, Rubedo
- \`ALCHEMY/GRIMOIRE.md\` — Governing principles of the practitioner-tool partnership
- \`ALCHEMY/ARCHETYPES.md\` — The Three Archetypes: Builder, Maker, Connector
- \`ALCHEMY/RITUALS.md\` — Daily and seasonal practices
- \`ALCHEMY/SACRED.md\` — Sacred principles and non-negotiables
- \`ALCHEMY/TRADITIONS.md\` — Initiatic lineages and practices

---

## Operational Files

- \`MISSION.md\` — Core mission and why it matters
- \`GOALS.md\` — Current active goals with priorities
- \`BELIEFS.md\` — Core beliefs and worldview
- \`STRATEGIES.md\` — Active strategies for achieving goals
- \`CHALLENGES.md\` — Current obstacles and how I am addressing them
- \`LEARNED.md\` — Lessons from technical and creative work

---

## Self-Knowledge

- \`FRAMES.md\` — Mental lenses I use to interpret situations
- \`MODELS.md\` — Structural frameworks I rely on
- \`WRONG.md\` — Things I believed that turned out to be false
- \`NARRATIVES.md\` — How I describe myself and my work to the world
- \`AUTHORS.md\` — Thinkers and makers who shaped my thinking
- \`TRAUMAS.md\` — Formative difficulties that changed my direction

---

## Wisdom Layer

- \`WISDOM.md\` — Timeless principles and aphorisms
- \`BOOKS.md\` — Books that shaped my thinking
- \`MOVIES.md\` — Films that influenced my worldview
- \`MUSIC.md\` — Musical life and influences
- \`QUOTES.md\` — Memorable lines worth keeping

---

## Future-Oriented

- \`PROBLEMS.md\` — World problems I feel called to address
- \`PREDICTIONS.md\` — Forecasts with confidence levels
- \`IDEAS.md\` — Uncommitted project ideas

---

## Log

- \`UPDATES.md\` — Changelog for TELOS modifications
- \`STATUS.md\` — Weekly snapshot across life areas
`)

writeRaw('TELOS/MISSION.md', `# Mission

> Why I do what I do, distilled to its essence.

---

## The Statement

I help organizations and makers work better by building tools and systems that respect the people who use them — technically sound, humanly designed, and genuinely open.

My work sits at the intersection of design, engineering, and economics. I take on creative and technical work that produces lasting value, not just deliverables.

## Why It Matters

Most tools are designed to extract attention and create dependency. I want to build and support the opposite: tools that give people back their time, their data, and their autonomy.

## What I Am Not

- Not an agency. I work directly, with care, on fewer things.
- Not a consultant who disappears after the deck. I stay close to implementation.
- Not a generalist who does everything. I go deep on design systems, distributed tools, and developer experience.

## The Through-Line

Whether I am designing brand identity for Lumina Studios, building API integrations for Verdant Systems, or advising Nocturne Collective on digital strategy — the constant is: *make the tool serve the person, not the other way around.*
`)

writeRaw('TELOS/STATUS.md', `# Status

> Weekly snapshot across life areas. Updated each week.
> Last updated: 2026-05-04

---

## Work

**Lumina Studios — Brand Refresh (Phase 2)**
Visual identity system in final review. Presenting mockups to Alice this week. Phase 3 scope proposal being drafted.

**Verdant Systems — API Integration**
Project closed. Invoice IN000002 settled May 1. Positive relationship — potential future engagement.

**Nocturne Collective — Digital Strategy**
Invoice IN000004 overdue 50+ days. Sending second notice this week.

**PAI Data UI (r&d)**
Demo DataLayer complete. Telos Explorer now functional.

## Finances

- Monthly committed: 476 CAD
- YTD paid invoices: 14,594 CAD
- Outstanding: 7,748 CAD (Lumina Phase 2 draft + Nocturne overdue)

## Energy

Good focus this week. Mornings for deep work, afternoons for admin and follow-ups.

## Learning

Working through *Shape Up* by Ryan Singer. Also revisiting distributed systems concepts.

## Personal Practice

Morning meditation at 15 minutes. Reading: averaging 12 pages/evening.
`)

writeRaw('TELOS/GOALS.md', `# Goals

> Active goals by domain. Reviewed weekly, updated monthly.

---

## Client Work

- Complete and deliver Lumina Studios Phase 2 visual identity system
- Draft Phase 3 scope and present to Alice by May 15
- Collect overdue payment from Nocturne Collective
- Raise effective hourly rate from 75 to 95 CAD for next engagement

## PAI Data UI

- Ship v0.3 with PDF invoice export and improved ERP stats
- Write a short public post introducing the project architecture
- Establish a stable dev:demo experience for screencasts

## Personal Development

- Read at least one technical and one non-technical book per month
- Build a consistent morning routine before screen time
- Deepen understanding of distributed systems and local-first patterns

## Financial

- Maintain monthly income above 8,000 CAD gross
- Reduce outstanding invoices to zero by end of Q2 2026
- Build a 3-month operating reserve

## Long-Term (1-3 years)

- Transition 30% of income to product/tool work
- Publish a design system or developer tool as open source with real adoption
`)

writeRaw('TELOS/CHALLENGES.md', `# Challenges

> Current obstacles and how I am responding to them.

---

## Overdue Receivables

**Challenge:** Nocturne Collective invoice IN000004 is 50+ days overdue at 2,000 CAD.

**Response:** Sending a firm second notice this week. Escalating to formal demand if no response by May 15.

---

## Scope Creep in Client Work

**Challenge:** Lumina Phase 2 expanded beyond original spec without renegotiating scope.

**Response:** Documenting Phase 3 scope meticulously. Building a change-order habit.

---

## Isolation as a Solo Practitioner

**Challenge:** No peer review, no design critique, no architectural rubber-duck.

**Response:** Monthly call with two other freelancers for project reviews.

---

## Shallow Technical Depth in Distributed Systems

**Challenge:** Knowledge is patchy — strong on concepts, weak on implementation.

**Response:** Dedicated reading block on distributed systems (1h/week). PAI Data UI as a practical playground.
`)

writeRaw('TELOS/STRATEGIES.md', `# Strategies

> Active approaches for achieving goals. Reviewed quarterly.

---

## Fewer, Deeper Engagements

Focus on 2-3 meaningful client engagements at a time. Deeper work, stronger relationships, better results.

## The Demo as a Sales Tool

PAI Data UI serves double duty: a genuine personal tool and a live demonstration of technical and design sensibility.

## Rate Through Positioning, Not Negotiation

Raise rate by demonstrating value (case studies, referrals, visible work) rather than negotiating harder.

## Build in Public (Selectively)

Technical writing and open source work creates inbound interest without direct sales effort.

## Time-Blocking for Deep Work

Client delivery work in the morning. Communication and admin in the afternoon. No exceptions.

## The Local-First Default

For personal tools and infrastructure, always prefer local-first: data I own, systems I can inspect.
`)

writeRaw('TELOS/PROBLEMS.md', `# Problems

> World problems I feel called to address through my work and thinking.

---

## Tool Dependency and Data Imprisonment

Most professional tools trap users' data in proprietary formats. PAI Data UI is a direct answer: open formats, local-first, fully owned.

## Extractive Design Patterns

Attention economies reward interfaces designed to maximize engagement over utility. Good design should accomplish the task and get out of the way.

## Invisible Value in Creative Work

Freelancers routinely undercharge because their value is invisible. Better tooling for tracking and communicating value changes what people can charge.

## Concentration of Infrastructure

Most digital infrastructure runs on three cloud providers. The shift toward local-first tools and federated systems is necessary, not just desirable.

## The Craft Gap in Technical Work

As tooling improves, the floor of technical output rises but the ceiling drops. I want to occupy and defend the high end.
`)

writeRaw('TELOS/BELIEFS.md', `# Beliefs

> Core worldview principles. These are working hypotheses, not dogmas.

---

## Craft Is a Form of Ethics

How something is made matters as much as what it does. Someone else will maintain this. Someone else will use this. That person deserves your best effort.

## Autonomy Over Convenience

Given a choice between convenient-but-opaque and harder-but-owned, choose ownership. Convenience is a subscription; autonomy compounds.

## Complexity Hides Poor Thinking

When a system is hard to explain, the thinking behind it is incomplete. Simplicity is what you get when the thinking is done.

## Small Teams Build Better Things

The best work comes from small, high-trust teams with clear mandates. Large committees produce compromises; small groups produce decisions.

## Open Source Is Infrastructure, Not Ideology

Open source is an engineering approach with specific tradeoffs — for foundational tools, those tradeoffs usually favor openness.

## Local-First Is the Right Default for Personal Tools

Data on your machine, in open formats, readable with a text editor — this is the most resilient architecture for personal tooling.

## Rest Is Productive

The culture that celebrates overwork is not high-performance — it is high-burnout. Protect sleep, breaks, and disconnection.
`)

writeRaw('TELOS/FRAMES.md', `# Frames

> Mental lenses I use to interpret situations.

---

## The Five Whys

Ask "why" five times before reaching for a solution. The first why reveals the symptom; the fifth approaches the root cause.

## Reversibility Test

Reversible decisions should be made fast and adjusted. Irreversible decisions warrant much more deliberation.

## The Stranger Test

Read the document or code as if encountering it for the first time. Would a capable stranger understand it?

## Long Game vs. Short Game

Every decision has a short-game and long-game cost/benefit. Most bad decisions optimize for the short game.

## Energy Accounting

A focused morning hour is worth three interrupted afternoon hours. Budget attention like money.

## The Minimum Useful Version

What is the smallest version that actually solves the problem? Build that first.

## Companion vs. Rescue

In collaborative work: accompany the person's process, do not rescue it. Rescuing creates dependency; companionship means staying present while the other makes their own decisions.
`)

writeRaw('TELOS/MODELS.md', `# Models

> Structural frameworks I rely on for decision-making and design.

---

## Shape Up (Basecamp)

Fixed time, variable scope. Assign a budget to a problem, not a spec. Prevents the bloat of requirements-driven development.

## Jobs to Be Done

People hire products to do a job. Understanding the job reveals requirements that feature lists never surface.

## The PARA Method (Tiago Forte)

Projects, Areas, Resources, Archives. Simple and durable information architecture.

## Double Diamond (Design Council)

Diverge before converging, twice. First: discover the right problem. Second: develop and deliver the right solution.

## The Lindy Effect

Technologies that have survived a long time are more likely to survive into the future. Plain text, SQLite, and HTTP have Lindy properties.

## Conway's Law

Systems are shaped by the communication structures of the organizations that build them. To change the architecture, change how the team communicates.
`)

writeRaw('TELOS/WRONG.md', `# Wrong

> Things I believed that turned out to be false.

---

## "More features = more value"

Users wanted fewer, better things. Minimal useful beats comprehensive underused every time.

**Updated belief:** Value comes from solving one problem exceptionally well.

---

## "Clients want technical excellence"

Most clients care about outcomes — does it work, is it fast, can my team maintain it?

**Updated belief:** Lead with outcomes; let excellence show through, not be explained.

---

## "Saying yes builds relationships"

Taking every project and request created exhaustion and resentment, not goodwill.

**Updated belief:** Saying no clearly and early is more respectful than saying yes and delivering poorly.

---

## "Tools don't matter that much"

Friction in tools compounds: bad tooling kills focus, slows iteration, drains energy.

**Updated belief:** Tool selection and environment design are legitimate creative investments.

---

## "Distributed systems are for large teams"

Architecture choices have values embedded in them. Sovereignty and resilience are valuable at any scale.

**Updated belief:** Choose tools that reflect the values you want to live with.
`)

writeRaw('TELOS/LEARNED.md', `# Learned

> Technical and creative lessons from specific project experience.

---

## SQLite Is Underestimated

**From:** PAI Data UI development

SQLite scales to millions of rows on a laptop, supports FTS5, requires zero configuration. The mental model that SQLite is "for small projects" is wrong.

---

## Chokidar + SQLite Makes a Capable Live Index

**From:** PAI Data UI sync engine

Watching a directory of markdown files with Chokidar and syncing into SQLite gives a live, searchable index of plaintext content. A reusable pattern for any local-first tool needing search.

---

## Effect TS Pays Off on Data Layer Errors

**From:** PAI Data UI data layer

Typed errors in server routes make error handling explicit at the boundary. Worth the overhead for any data layer that will be maintained.

---

## Brand Strategy Before Logo Design

**From:** Lumina Studios engagement

Starting with a strategy workshop before any visual exploration saved significant rework. The logo emerged from the strategy.

---

## API Integration Requires an Error Budget Discussion

**From:** Verdant Systems engagement

Error handling for external dependencies needs to be scoped explicitly — it can double the implementation time.
`)

writeRaw('TELOS/NARRATIVES.md', `# Narratives

> How I describe myself and my work in public contexts.

---

## Short Bio (100 words)

I am a Montreal-based freelance designer and developer working at the intersection of visual identity, developer tooling, and small-team infrastructure. I help organizations build design systems, technical integrations, and digital strategies that last beyond the engagement.

My personal projects include PAI Data UI — a local-first web application for managing CRM, ERP, and project data through markdown files. I believe the best tools are the ones you own completely.

---

## Elevator Pitch (30 seconds)

"I work with small teams and organizations that need design and technical work done at high quality, without agency overhead. I specialize in brand identity, developer tooling, and the internal infrastructure that makes everything else run smoother."

---

## Technical Identity

"Full-stack with a design background. Comfortable in TypeScript, SvelteKit, SQLite, and distributed systems. I build local-first tools with a strong preference for open formats and minimal dependencies."

---

## Why I Work the Way I Do

I am a freelancer because I want to work deeply on fewer things, with direct accountability, and without the overhead of large teams. I do not want to scale into an agency. I want to go deeper.
`)

writeRaw('TELOS/WISDOM.md', `# Wisdom

> Timeless principles and distilled lessons. Not rules — navigation aids.

---

## On Work

- A constraint answered is a feature discovered.
- The first version should embarrass you slightly. If it does not, you waited too long to ship.
- Naming things well is half of architecture. The other half is deciding what not to build.
- Maintenance is the real product. The launch is just the demo.

## On Clients and Collaboration

- The most important thing before a project starts is to agree on what done means.
- Silence from a client is not approval — it is ambiguity. Ask for confirmation.
- The person paying for the work has the right to make the wrong decision. Make sure they understand the tradeoffs first.

## On Learning

- Confusion is the beginning of understanding, not evidence of failure.
- Read the primary source before the summary. Summaries teach you what to think; sources teach you how to think.
- You learn a framework deeply only when you try to teach it to someone else.

## On Time and Energy

- Not all hours are equal. Guard the first two hours of the day.
- Saying yes to one thing is saying no to everything else at that moment. Make it conscious.
- Urgency and importance are different axes. Most urgent things are not important.

## On Character

- Integrity means the same behavior whether or not anyone is watching.
- Consistency over time is more rare and more valuable than talent.
`)

writeRaw('TELOS/BOOKS.md', `# Books

> Books that shaped my thinking.

---

## Design & Craft

**The Design of Everyday Things** — Don Norman
The foundational text on user-centered design. Blame the system, not the user.

**Shape Up** — Ryan Singer
Fixed time, variable scope. The concept of a "bet" instead of a spec is the most practical project management idea I have adopted.

**Thinking with Type** — Ellen Lupton
Typography as thought made visible.

---

## Systems & Technology

**A Philosophy of Software Design** — John Ousterhout
Deep modules, shallow interfaces. Complexity management as the central challenge of software.

**Designing Data-Intensive Applications** — Martin Kleppmann
The clearest explanation of distributed systems tradeoffs I have read.

---

## Business & Practice

**Company of One** — Paul Jarvis
A philosophy of intentional smallness. Validated my choice to stay a solo practitioner.

**Getting Things Done** — David Allen
The capture habit. Getting things out of your head into a trusted place changed my daily life.

---

## Philosophy & Mind

**Antifragile** — Nassim Taleb
Systems that benefit from disorder. Changed how I think about redundancy and optionality.

**How to Think** — Alan Jacobs
What makes thinking better or worse. Particularly useful on intellectual tribalism.
`)

writeRaw('TELOS/MOVIES.md', `# Movies

> Films that influenced my worldview or that I return to.

---

## On Work and Craft

**Jiro Dreams of Sushi** (2011)
A documentary about mastery. The most direct argument I know for choosing craft as a life orientation.

**Margin Call** (2011)
About what happens to ethics when institutional pressure mounts. Useful to rewatch when tempted to cut corners.

---

## On Systems and Structures

**2001: A Space Odyssey** (1968, Kubrick)
About the relationship between humans and the tools they build. HAL is not a villain — he is a design failure.

**The Social Dilemma** (2020)
A clear-eyed explanation of extractive attention design.

---

## On Perspective

**My Neighbor Totoro** (1988, Miyazaki)
A film about presence and wonder. A reminder that not everything needs to be optimized.

**Encounters at the End of the World** (2007, Herzog)
About people who chose the extreme periphery of human experience. On what lives are possible when you stop optimizing for comfort.
`)

writeRaw('TELOS/MUSIC.md', `# Music

> Musical life — what I listen to, what I have studied, what moves me.

---

## What I Listen To

**For deep work:** Ambient, minimal techno, Brian Eno, Jon Hopkins, Max Richter. No vocals — the rhythm sets pace without pulling attention.

**For energy:** Post-rock (Explosions in the Sky, Mogwai), jazz (Miles Davis, Bill Evans, Coltrane).

**For thinking:** Silence, or classical guitar. Francisco Tárrega, Leo Brouwer.

---

## Practice

Classical guitar at an amateur level. 20-30 minutes in the evening. The one activity that is purely for itself, with no output, no deliverable, and no client.

The discipline of learning a piece bar by bar, slower than feels productive, until it becomes automatic — a useful model for how all skill acquisition works.

---

## What Music Teaches

- Rhythm is a container. What happens inside is expression; what defines it is craft.
- Improvisation requires deeply knowing the rules you are departing from.
- Some pieces need to be listened to twenty times before they open. Patience with art trains patience with people.
`)

writeRaw('TELOS/QUOTES.md', `# Quotes

> Lines I return to.

---

"The beginning of wisdom is to call things by their proper names." — Confucius

"Design is not how something looks. Design is how something works." — Steve Jobs

"Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away." — Antoine de Saint-Exupéry

"A complex system that works is invariably found to have evolved from a simple system that worked." — John Gall

"In theory, theory and practice are the same. In practice, they are not." — attributed to various

"Don't explain your philosophy. Embody it." — Epictetus

"Software is never finished, only abandoned." — anonymous

"What gets measured gets managed." — Peter Drucker

"The value of a prototype is in the questions it generates, not in the answers it provides." — unknown

"Make things as simple as possible, but not simpler." — attributed to Einstein

"The best way to predict the future is to invent it." — Alan Kay
`)

writeRaw('TELOS/PREDICTIONS.md', `# Predictions

> Forecasts with confidence levels and time horizons. Revisited annually.

---

## Technology

**Local-first tools will become mainstream for knowledge workers (3-5 years, 75%)**
Privacy concerns and SaaS fatigue will drive adoption. Obsidian's growth is an early signal.

**LLM assistance will become a commodity, craft will differentiate (2-3 years, 85%)**
The premium will shift to people who can frame problems, evaluate outputs, and integrate work coherently.

**Browser-based SQLite will enable a new class of local-first web apps (2-4 years, 65%)**
WASM SQLite + sync primitives will make fully offline-capable web apps practical.

---

## Work and Economy

**Solo practitioners will continue to outperform large agencies for creative work (ongoing, 80%)**
Large agencies have structural overhead that prevents the depth and responsiveness clients increasingly want.

**Remote-first will become a durable norm for technical and creative roles (ongoing, 90%)**
The productivity data and talent access arguments are too strong to reverse.

---

## Personal

**I will productize at least one tool in the next 3 years (70%)**
PAI Data UI or a derivative will reach a state where it has genuine value for other practitioners.
`)

writeRaw('TELOS/IDEAS.md', `# Ideas

> Uncommitted project ideas. Not plans — seeds worth keeping visible.

---

## Design System Registry (Open Source)

A shareable, version-controlled design token and component library format that works across frameworks. Not another UI kit — a specification format any tool can consume.

**Status:** Thinking stage.

---

## Invoice-to-CRM Automation Layer

A lightweight tool that reads paid invoice history and automatically updates CRM opportunity status and contact last-touch dates.

**Status:** Half-built in my head. Would solve my own workflow immediately.

---

## "Design Audit" as a Productized Service

Fixed-scope, fixed-price design audit: 5 days, 10 pages, documented findings. No custom scoping.

**Status:** Interested. Waiting until Lumina Phase 3 is complete.

---

## Personal Knowledge Graph (Local)

Visualizing connections between TELOS files, project notes, and research — SQLite FTS + D3 force graph.

**Status:** Nascent.

---

## Freelance Rate Transparency Resource

An anonymized, opt-in dataset for freelance design and development rates in Montreal. The market has no price transparency.

**Status:** Interested but uncertain about effort-to-impact ratio.
`)

writeRaw('TELOS/UPDATES.md', `# TELOS Updates

> Changelog for TELOS modifications.

---

## 2026-05-04

- **Files Modified:** STATUS.md, GOALS.md, CHALLENGES.md
- **Change Type:** Weekly review update
- **Description:** Full status review — all six life areas updated. Added Nocturne invoice follow-up as active challenge. Updated Lumina Phase 2 progress.

---

## 2026-04-28

- **Files Modified:** STATUS.md, STRATEGIES.md
- **Change Type:** Targeted update from project review
- **Description:** Updated status after Lumina Phase 2 milestone. Added "Demo as Sales Tool" strategy entry.

---

## 2026-04-14

- **Files Modified:** GOALS.md, LEARNED.md
- **Change Type:** Post-project retrospective
- **Description:** Added Verdant API integration lessons. Updated financial goals after Verdant invoice sent.

---

## 2026-03-10

- **Files Modified:** STATUS.md, CHALLENGES.md, WRONG.md
- **Change Type:** Quarterly review
- **Description:** First quarterly TELOS review. Added scope creep pattern to CHALLENGES.md.

---

## 2026-02-01

- **File Created:** All TELOS files
- **Change Type:** Initial setup
- **Description:** TELOS Life Operating System initialized.
`)

writeRaw('TELOS/AUTHORS.md', `# Authors

> Thinkers, makers, and practitioners who shaped my thinking.

---

## Design

**Don Norman** — User-centered design, affordances, the psychology of everyday objects.

**Dieter Rams** — Less but better. His ten principles of good design are a design ethics checklist.

**Ellen Lupton** — Typography as meaning-making.

**Ryan Singer** — Product thinking and scope management. *Shape Up* is the most actionable PM framework I have encountered.

---

## Technology

**John Ousterhout** — Complexity management in software. *A Philosophy of Software Design*.

**Martin Kleppmann** — Distributed systems thinking made practical.

**Rich Harris** — The creator of Svelte. His philosophy of minimum viable abstraction.

**Alan Kay** — Objects, Smalltalk, and what computing could be.

---

## Business and Practice

**Paul Jarvis** — The ethics and strategy of staying small. *Company of One*.

**Nassim Taleb** — Fragility, randomness, and how systems fail.

---

## Philosophy and Mind

**Epictetus** — The Stoic dichotomy of control. Most useful when a client or project is behaving badly.

**Alan Jacobs** — Charitable thinking and intellectual belonging. *How to Think*.
`)

writeRaw('TELOS/TRAUMAS.md', `# Traumas

> Formative difficulties that changed direction or understanding.

---

*This file holds experiences that shaped my work and values — not to dwell on them, but to understand where certain instincts come from.*

---

## The Project That Shipped Without Tests

A client engagement early in my career. We delivered on time and on budget. Six months later, a routine update broke the system and no one could diagnose why.

**What it left:** An almost irrational commitment to documentation and testability. Untested, undocumented work is not finished work — it is a liability handed to a future self.

---

## Saying Yes Until I Could Not

A period of taking every project offered, every favour requested, every scope expansion. I told myself I was building relationships. What I was building was a pattern of exhaustion and resentment.

**What it left:** A healthy instinct to pause before any yes. "What am I saying no to in order to say yes to this?" is now reflexive.

---

## A Partnership That Ended Badly

A collaboration that broke down over expectations never made explicit. We both assumed we had agreed on scope, ownership, and credit. We had not.

**What it left:** Written agreements before any collaboration. Making assumptions explicit early, at the cost of seeming overly formal.
`)

writeRaw('TELOS/ALCHEMY/SULPHUR.md', `# Sulphur: The Essential Fire

> What I would pursue even if all the tools changed.

---

## The First Principle

I am a maker at the intersection of craft and technology. My work is to build tools, systems, and identities that serve people with more clarity, autonomy, and dignity than what existed before.

## What Does Not Change

Regardless of which clients I work with, which stack I use, or how the market shifts:

- I make things that are honest in their construction
- I make things that can be understood and maintained by others
- I make things that extend people's capability rather than creating dependency
- I make things I am not ashamed to explain

## The Three Modes

- **The Builder:** when I construct and architect — code, systems, infrastructure
- **The Maker:** when I form and shape — visual identity, design systems, interfaces
- **The Connector:** when I translate — between disciplines, between clients and technology

→ *Common fire: "Craft in service of human capability."*

## What Must Not Be Automated Away

- The judgment about what to build and what not to build
- The ethical sense of who this serves and whether it should exist
- The aesthetic sense of when something is finished vs. merely functional
- The relational work of understanding what a client actually needs vs. what they asked for
`)

writeRaw('TELOS/ALCHEMY/GREAT_WORK.md', `# The Great Work

> The opus magnum — the long arc of the work across time.

---

## Three Stages

Following the alchemical model: Nigredo (dissolution), Albedo (purification), Rubedo (synthesis).

---

## Nigredo — Current Stage

**Theme:** Confronting the gap between potential and execution.

The Nigredo work is:
- Building sustainable systems (PAI Data UI is an example)
- Reducing the gap between what I say I will do and what I do
- Confronting avoidance patterns (scope creep, over-promising, under-resting)

---

## Albedo — The Vision

**Theme:** Clarity of craft and contribution.

A practice of work where the quality of the output reliably reflects the quality of the intention. Where the systems I use support rather than complicate.

---

## Rubedo — The Long Horizon

**Theme:** Transmission and contribution.

The work leaves something behind that outlasts the individual engagement. Open source tools with real adoption. Documentation that teaches.

Not fame — usefulness. Not scale — depth.

---

## What This Means Today

- Does this deliverable have integrity?
- Is this documentation good enough for a stranger to maintain?
- Did I protect my focused time today?
`)

writeRaw('TELOS/ALCHEMY/ARCHETYPES.md', `# Archetypes

> The three modes of being — not roles, but expressions of the essential fire.

---

## The Builder

**When it activates:** Constructing systems, writing code, designing architecture.

**Signature:** The work has structure. Things connect in defined ways. The Builder takes pleasure in the invisible coherence of a well-made system.

**Shadow:** Can over-engineer and delay shipping. Needs the Connector to ask "but who is this for?"

**Current expression:** PAI Data UI architecture, SQLite sync engine.

---

## The Maker

**When it activates:** Visual identity design, typography, layout, interface aesthetics.

**Signature:** Form carries meaning. A typeface is an argument. A colour palette is a position.

**Shadow:** Can pursue aesthetic refinement past the point of usefulness.

**Current expression:** Lumina Studios brand identity, UI component decisions.

---

## The Connector

**When it activates:** Client work, strategy sessions, translating between technical and non-technical stakeholders.

**Signature:** Understands multiple vocabularies and can move between them.

**Shadow:** Can over-accommodate and avoid necessary confrontation.

**Current expression:** Nocturne Collective digital strategy, client discovery workshops.

---

## The Integration

The best work uses all three. The challenge is knowing which mode a situation calls for — and not applying the wrong one.
`)

writeRaw('TELOS/ALCHEMY/GRIMOIRE.md', `# Grimoire

> Governing principles of the practitioner-tool partnership.
> How I work with AI assistance: what it is for, what it is not for.

---

## What the Tool Is For

- Accelerating execution of decisions I have already made
- Surfacing options and tradeoffs I may not have considered
- Drafting starting points that I then revise with judgment
- Managing repetitive, structured tasks with high accuracy

## What the Tool Is Not For

- Making decisions about what to build and why
- Determining the ethical dimensions of a project
- Evaluating whether a piece of design or code is *good*
- Replacing the relational work of understanding a client's actual needs

## Rules of the Partnership

**1. Evidence before assertion.** The tool must not claim a state exists without having checked it.

**2. Surgical fixes only.** When debugging, make the smallest change that resolves the issue.

**3. Plan before action on complex tasks.** Present the plan before executing.

**4. The decision belongs to me.** The tool provides counsel. I decide.

**5. Coagulation before session end.** Any insight worth keeping must be written before the session closes.

## On Transparency

The tool's errors are my responsibility to catch. I do not outsource verification.
`)

writeRaw('TELOS/ALCHEMY/RITUALS.md', `# Rituals

> Daily and seasonal practices that structure and sustain the work.

---

## Daily

**Morning (before screen)**
- 15 minutes meditation — breath-focused
- Physical movement: 10 minutes
- Review today's focus list before opening email

**Work blocks**
- Deep work: 9:00–12:00 (protected, no notifications)
- Admin and communication: 14:00–16:00

**Evening**
- 10-15 minutes of reading (physical book)
- Brief note of what was completed and what carries to tomorrow

---

## Weekly

- Sunday evening: review focus list, set week priorities
- Friday afternoon: review completed tasks, invoice unbilled work, check outstanding receivables

---

## Monthly

- First Monday: review GOALS.md and CHALLENGES.md
- Mid-month: financial review
- End of month: update UPDATES.md

---

## Quarterly

- Full TELOS review: re-read all core files, update STATUS.md comprehensively
- Project retrospectives: what worked, what did not
- Rate and positioning review
`)

writeRaw('TELOS/ALCHEMY/SACRED.md', `# Sacred

> Non-negotiable principles. These are not preferences — they are load-bearing commitments.

---

## Data Sovereignty

I do not use tools I cannot inspect for data I care about. Personal notes, client records, financial data — these live in formats I can read without the vendor's permission. PAI Data UI exists because of this commitment.

## Honest Communication

I do not soften bad news to the point of ambiguity. Clear is kind.

## Work Worth Defending

I will not deliver work I would not put my name on. Shipping bad work in silence is a slow erosion of self-respect.

## Rest Is Not Negotiable

Sleep, physical movement, and time away from screens are preconditions for doing work well. I protect these as I would protect a client commitment.

## The Long Game

I do not sacrifice the long-term relationship for the short-term transaction. I do not oversell. I do not take credit that belongs to others.

## Ownership of Mistakes

When I make an error, I own it immediately, explain it clearly, and propose a path forward. Defensive explanations are the fastest way to lose trust permanently.
`)

writeRaw('TELOS/ALCHEMY/TRADITIONS.md', `# Traditions

> Learning traditions and practices that shape my orientation.

---

## Open Source Culture

The ethic of sharing knowledge, making code reviewable, and building on what others have made is foundational. It is not a political position — it is a way of thinking about knowledge and contribution.

What it asks: share what I build. Document what I learn. Credit what I use.

---

## The Craft Tradition

Work can be executed with care. Excellence is built through deliberate practice. The gap between adequate and excellent is worth crossing.

What it asks: go slower than feels productive. Redo the parts that are not right. Do not confuse completion with quality.

---

## Contemplative Practice

Meditation and regular reflection are not additions to the work — they are conditions for doing it well. Without a practice that slows the reactive mind, I cannot distinguish between a real insight and an anxious impulse to act.

What it asks: protect the morning. Sit before screen.

---

## The Local and the Global

Working in French and English, with clients in multiple industries — navigating plurality, holding multiple frames simultaneously. The friction of translation creates understanding.

What it asks: do not flatten the complexity. Translate carefully. Respect what gets lost.
`)

// ─── Done ─────────────────────────────────────────────────────────────────────

const counts = {
  'CRM/organizations': 3,
  'CRM/contacts': 5,
  'CRM/opportunities': 3,
  'ERP/invoices': 4,
  'ERP/expenses': 5,
  'ERP/income': 2,
  'ERP/payments': 5,
  'PM/projects': 2,
  'PM/tasks': 6,
  'PM/focus': 6,
  'VF/resource-specs': 2,
  'VF/work': 3,
  'VF/payments': 2,
  'TELOS/core': 3,
  'TELOS/growth': 4,
  'TELOS/reflection': 6,
  'TELOS/wisdom': 5,
  'TELOS/futures': 3,
  'TELOS/authors': 2,
  'TELOS/alchemy': 7,
}

console.log('\nDemo DataLayer seeded successfully:\n')
for (const [domain, count] of Object.entries(counts)) {
  console.log(`  ${domain.padEnd(22)} ${count} files`)
}
console.log(`\n  Total: ${Object.values(counts).reduce((a, b) => a + b, 0)} entity files`)
console.log(`\n  Root: ${DEMO_ROOT}`)
console.log('\nRun "bun run dev:demo" to start the app with demo data.\n')
