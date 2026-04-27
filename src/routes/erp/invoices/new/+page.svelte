<script lang="ts">
  import { goto } from '$app/navigation'
  import type { PageData } from './$types.js'
  import type { Organization, Contact, Opportunity } from '$lib/data/types.js'
  import ChipsInput from '$lib/components/shared/ChipsInput.svelte'

  let { data }: { data: PageData } = $props()

  // ── org/contact/opportunity state ─────────────────────────
  let orgName = $state('')
  let orgId = $state('')
  let contactName = $state('')
  let contactId = $state('')
  let oppTitle = $state('')
  let oppId = $state('')
  let clientError = $state('')

  const matchedOrg = $derived(
    (data.organizations as Organization[]).find(
      (o: Organization) => o.name.toLowerCase() === orgName.toLowerCase()
    )
  )
  const matchedContact = $derived(
    (data.contacts as Contact[]).find(
      (c: Contact) => c.name.toLowerCase() === contactName.toLowerCase()
    )
  )
  const matchedOpp = $derived(
    (data.opportunities as Opportunity[]).find(
      (o: Opportunity) => o.title.toLowerCase() === oppTitle.toLowerCase()
    )
  )

  function onOrgInput(e: Event) {
    const val = (e.target as HTMLInputElement).value
    orgName = val
    const found = (data.organizations as Organization[]).find(
      (o: Organization) => o.name.toLowerCase() === val.toLowerCase()
    )
    orgId = found ? found.id : ''
    if (val) clientError = ''
  }

  function onContactInput(e: Event) {
    const val = (e.target as HTMLInputElement).value
    contactName = val
    const found = (data.contacts as Contact[]).find(
      (c: Contact) => c.name.toLowerCase() === val.toLowerCase()
    )
    contactId = found ? found.id : ''
    if (found?.organization && !orgName) {
      orgName = found.organization
      const foundOrg = (data.organizations as Organization[]).find(
        (o: Organization) => o.name.toLowerCase() === found.organization.toLowerCase()
      )
      orgId = foundOrg ? foundOrg.id : ''
    }
    if (val) clientError = ''
  }

  function onOppInput(e: Event) {
    const val = (e.target as HTMLInputElement).value
    oppTitle = val
    const found = (data.opportunities as Opportunity[]).find(
      (o: Opportunity) => o.title.toLowerCase() === val.toLowerCase()
    )
    oppId = found ? found.id : ''
    if (found?.organization && !orgName) {
      orgName = found.organization
      const foundOrg = (data.organizations as Organization[]).find(
        (o: Organization) => o.name.toLowerCase() === found.organization.toLowerCase()
      )
      orgId = foundOrg ? foundOrg.id : ''
    }
  }

  let saving = $state(false)

  async function onSubmit(e: Event) {
    e.preventDefault()
    if (!orgName.trim() && !contactName.trim()) {
      clientError = 'Fill in at least Organization or Contact.'
      return
    }
    saving = true
    const fd = new FormData(e.target as HTMLFormElement)
    const tax_rate = taxRate ? Number.parseFloat(taxRate) : undefined
    const tax_amount = tax_rate ? Math.round(subtotal * tax_rate * 100) / 100 : undefined
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization: orgName,
        organization_id: orgId || undefined,
        contact_name: contactName || undefined,
        contact_id: contactId || undefined,
        currency: fd.get('currency') || 'CAD',
        issue_date: fd.get('issue_date'),
        due_date: fd.get('due_date'),
        status: fd.get('status') || 'draft',
        tags,
        opportunity_id: oppId || undefined,
        notes: (fd.get('notes') as string)?.trim() || undefined,
        tax_rate,
        tax_label: taxLabel.trim() || undefined,
        tax_amount,
        line_items: lines.filter(l => l.description.trim()).map(l => ({
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          amount: l.quantity * l.unit_price
        })),
        subtotal,
        total: subtotal + (tax_amount ?? 0)
      })
    })
    const json = await res.json()
    if (json.invoice?.id) goto(`/erp/invoices/${json.invoice.id}`)
    else { clientError = json.detail ?? 'Failed to create invoice'; saving = false }
  }

  // ── line items ────────────────────────────────────────────
  let lines = $state([{ description: '', quantity: 1, unit_price: 0 }])

  const addLine = () => lines.push({ description: '', quantity: 1, unit_price: 0 })
  const removeLine = (i: number) => lines.splice(i, 1)
  const amount = (l: { quantity: number; unit_price: number }) => l.quantity * l.unit_price
  const subtotal = $derived(lines.reduce((s, l) => s + amount(l), 0))

  // ── tags ──────────────────────────────────────────────────
  let tags = $state<string[]>([])

  // ── tax ───────────────────────────────────────────────────
  let taxRate = $state('')
  let taxLabel = $state('')
  const taxAmount = $derived(
    taxRate ? Math.round(subtotal * Number.parseFloat(taxRate) * 100) / 100 : 0
  )
  const total = $derived(subtotal + taxAmount)

  // ── formatting ────────────────────────────────────────────
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

  const today = new Date().toISOString().split('T')[0]
  const in30 = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0]

  const inputCls =
    'w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-500'
  const labelCls = 'block text-xs text-gray-500 mb-1'
</script>

<datalist id="orgs-list">
  {#each data.organizations as org}
    <option value={org.name}>{org.name}</option>
  {/each}
</datalist>

<datalist id="contacts-list">
  {#each data.contacts as c}
    <option value={c.name}>{c.name} — {c.organization}</option>
  {/each}
</datalist>

<datalist id="opps-list">
  {#each data.opportunities as opp}
    <option value={opp.title}>{opp.title} ({opp.organization})</option>
  {/each}
</datalist>

<div class="p-6 max-w-3xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/erp" class="text-gray-500 hover:text-gray-300 text-sm">← Invoices</a>
    <h1 class="text-xl font-semibold text-gray-100">New Invoice</h1>
  </div>

  <form method="POST" class="space-y-5" onsubmit={onSubmit}>

    <!-- ── Client section ─────────────────────────────── -->
    <div class="bg-gray-900 rounded-lg p-5 border border-gray-800 space-y-4">
      <div class="flex items-baseline gap-2">
        <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wide">Client</h2>
        <span class="text-xs text-gray-600">at least one of Organization or Contact required</span>
      </div>

      {#if clientError}
        <p class="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded px-3 py-2">{clientError}</p>
      {/if}

      <!-- Organization -->
      <div>
        <label class={labelCls} for="organization">Organization</label>
        <input
          id="organization"
          name="organization"
          list="orgs-list"
          bind:value={orgName}
          oninput={onOrgInput}
          class={inputCls}
          placeholder="Search or type new organization…"
          autocomplete="off"
        />
        <input type="hidden" name="organization_id" value={orgId} />
        {#if orgName && !matchedOrg}
          <p class="text-xs text-yellow-500 mt-1">New organization — will be created on save</p>
        {:else if matchedOrg}
          <p class="text-xs text-green-500 mt-1">Existing: {matchedOrg.id}</p>
        {/if}
      </div>

      <!-- Contact -->
      <div>
        <label class={labelCls} for="contact_name">Contact</label>
        <input
          id="contact_name"
          name="contact_name"
          list="contacts-list"
          bind:value={contactName}
          oninput={onContactInput}
          class={inputCls}
          placeholder="Search or type new contact…"
          autocomplete="off"
        />
        <input type="hidden" name="contact_id" value={contactId} />
        {#if contactName && !matchedContact}
          <p class="text-xs text-yellow-500 mt-1">New contact — will be created on save</p>
        {:else if matchedContact}
          <p class="text-xs text-green-500 mt-1">Existing: {matchedContact.id}</p>
        {/if}
      </div>

      <!-- Opportunity -->
      <div>
        <label class={labelCls} for="opportunity_title">Opportunity (optional)</label>
        <input
          id="opportunity_title"
          name="opportunity_title"
          list="opps-list"
          bind:value={oppTitle}
          oninput={onOppInput}
          class={inputCls}
          placeholder="Search existing opportunities…"
          autocomplete="off"
        />
        <input type="hidden" name="opportunity_id" value={oppId} />
        {#if oppTitle && !matchedOpp}
          <p class="text-xs text-gray-500 mt-1">No match — opportunity field will be left empty</p>
        {:else if matchedOpp}
          <p class="text-xs text-green-500 mt-1">Linked: {matchedOpp.id}</p>
        {/if}
      </div>
    </div>

    <!-- ── Invoice details ────────────────────────────── -->
    <div class="bg-gray-900 rounded-lg p-5 border border-gray-800 grid grid-cols-2 gap-4">
      <h2 class="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice Details</h2>

      <div>
        <label class={labelCls} for="issue_date">Issue Date</label>
        <input id="issue_date" name="issue_date" type="date" value={today} class={inputCls} />
      </div>
      <div>
        <label class={labelCls} for="due_date">Due Date</label>
        <input id="due_date" name="due_date" type="date" value={in30} class={inputCls} />
      </div>
      <div>
        <label class={labelCls} for="status">Status</label>
        <select id="status" name="status" class={inputCls}>
          <option value="draft" selected>Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div>
        <label class={labelCls} for="currency">Currency</label>
        <select id="currency" name="currency" class={inputCls}>
          <option value="CAD">CAD</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <div class="col-span-2">
        <label class={labelCls}>Tags</label>
        <ChipsInput bind:tags />
        <input type="hidden" name="tags" value={tags.join(',')} />
      </div>
    </div>

    <!-- ── Line items ─────────────────────────────────── -->
    <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
      <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Line Items</h2>
      <table class="w-full text-sm mb-3">
        <thead>
          <tr class="text-gray-500 text-left">
            <th class="pb-2 pr-2 font-normal">Description</th>
            <th class="pb-2 px-2 font-normal text-right w-20">Qty</th>
            <th class="pb-2 px-2 font-normal text-right w-28">Unit Price</th>
            <th class="pb-2 pl-2 font-normal text-right w-28">Amount</th>
            <th class="pb-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {#each lines as line, i}
            <tr class="border-t border-gray-800">
              <td class="py-2 pr-2">
                <input
                  name="description"
                  bind:value={line.description}
                  class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Service description"
                />
              </td>
              <td class="py-2 px-2">
                <input name="quantity" type="number" min="0" step="any" bind:value={line.quantity}
                  class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 text-sm text-right focus:outline-none focus:border-blue-500" />
              </td>
              <td class="py-2 px-2">
                <input name="unit_price" type="number" min="0" step="0.01" bind:value={line.unit_price}
                  class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 text-sm text-right focus:outline-none focus:border-blue-500" />
              </td>
              <td class="py-2 pl-2 text-right text-gray-300 tabular-nums whitespace-nowrap">
                {fmt(amount(line))}
              </td>
              <td class="py-2 pl-1">
                {#if lines.length > 1}
                  <button type="button" onclick={() => removeLine(i)}
                    class="text-gray-600 hover:text-red-400 text-xs px-1" aria-label="Remove line">✕</button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <button type="button" onclick={addLine} class="text-xs text-blue-400 hover:text-blue-300">
        + Add line
      </button>

      <!-- Tax section -->
      <div class="mt-4 border-t border-gray-800 pt-4 grid grid-cols-2 gap-3">
        <div>
          <label class={labelCls} for="tax_rate">Tax Rate (e.g. 0.14975 for GST+QST)</label>
          <input id="tax_rate" name="tax_rate" type="number" min="0" max="1" step="0.001"
            bind:value={taxRate}
            class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-blue-500"
            placeholder="0.14975" />
        </div>
        <div>
          <label class={labelCls} for="tax_label">Tax Label</label>
          <input id="tax_label" name="tax_label" bind:value={taxLabel}
            class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-blue-500"
            placeholder="GST+QST" />
        </div>
      </div>

      <!-- Totals -->
      <div class="border-t border-gray-800 pt-3 mt-3 space-y-1">
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">Subtotal</span>
          <span class="text-gray-200 tabular-nums">{fmt(subtotal)}</span>
        </div>
        {#if taxAmount > 0}
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">{taxLabel || 'Tax'}</span>
            <span class="text-gray-200 tabular-nums">{fmt(taxAmount)}</span>
          </div>
        {/if}
        <div class="flex justify-between text-base font-semibold pt-2 border-t border-gray-700">
          <span class="text-gray-200">Total</span>
          <span class="text-gray-100 tabular-nums">{fmt(total)}</span>
        </div>
      </div>
    </div>

    <!-- ── Notes ──────────────────────────────────────── -->
    <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
      <label class={labelCls} for="notes">Notes (optional)</label>
      <textarea
        id="notes"
        name="notes"
        rows="3"
        class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-500 resize-y"
        placeholder="Payment terms, references, special instructions…"
      ></textarea>
    </div>

    <div class="flex gap-2">
      <button type="submit" disabled={saving} class="bg-blue-600 hover:bg-blue-500 text-white text-sm px-5 py-2 rounded transition-colors disabled:opacity-50">
        {saving ? 'Creating…' : 'Create Invoice'}
      </button>
      <a href="/erp" class="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancel</a>
    </div>

  </form>
</div>
