<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
  import { invalidateAll } from '$app/navigation'

  let { data } = $props()

  const cad = (n: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

  let marking = $state(false)

  async function markPaid() {
    marking = true
    await fetch(`/api/invoices/${data.invoice.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
    })
    await invalidateAll()
    marking = false
  }
</script>

<div class="p-6 max-w-3xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/erp" class="text-gray-500 hover:text-gray-300 text-sm">← Invoices</a>
    <h1 class="text-xl font-semibold text-gray-100">{data.invoice.number}</h1>
    <StatusBadge status={data.invoice.status} />
  </div>

  <div class="bg-gray-900 rounded-lg p-5 border border-gray-800 mb-4">
    <div class="flex justify-between mb-4">
      <div>
        <p class="text-gray-500 text-xs">Client</p>
        <p class="text-gray-200 font-medium">{data.invoice.organization}</p>
      </div>
      <div class="text-right">
        <p class="text-gray-500 text-xs">Issued / Due</p>
        <p class="text-gray-400 text-sm">{data.invoice.issue_date} → {data.invoice.due_date}</p>
        {#if data.invoice.paid_date}
          <p class="text-green-400 text-xs mt-1">Paid {data.invoice.paid_date}</p>
        {/if}
      </div>
    </div>

    <!-- Line items -->
    <table class="w-full text-sm mb-4">
      <thead>
        <tr class="text-gray-500 text-left border-b border-gray-800">
          <th class="pb-2 pr-4 font-normal">Description</th>
          <th class="pb-2 px-3 font-normal text-right w-16">Qty</th>
          <th class="pb-2 px-3 font-normal text-right w-28">Unit price</th>
          <th class="pb-2 pl-3 font-normal text-right w-28">Amount</th>
        </tr>
      </thead>
      <tbody>
        {#each data.invoice.line_items ?? [] as item}
          <tr class="border-t border-gray-800">
            <td class="py-2 pr-4 text-gray-300">{item.description}</td>
            <td class="py-2 px-3 text-right text-gray-400 tabular-nums whitespace-nowrap w-16">{item.quantity}</td>
            <td class="py-2 px-3 text-right text-gray-400 tabular-nums whitespace-nowrap w-28">{cad(item.unit_price)}</td>
            <td class="py-2 pl-3 text-right text-gray-200 tabular-nums whitespace-nowrap w-28">{cad(item.amount)}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="border-t border-gray-800 pt-3 space-y-1">
      <div class="flex justify-between text-sm">
        <span class="text-gray-400">Subtotal</span>
        <span class="text-gray-200 tabular-nums">{cad(data.invoice.subtotal)}</span>
      </div>
      {#if data.invoice.tax_amount}
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">{data.invoice.tax_label ?? 'Tax'}</span>
          <span class="text-gray-200 tabular-nums">{cad(data.invoice.tax_amount)}</span>
        </div>
      {/if}
      <div class="flex justify-between text-base font-semibold pt-1 border-t border-gray-700">
        <span class="text-gray-200">Total</span>
        <span class="text-gray-100 tabular-nums">{cad(data.invoice.total)}</span>
      </div>
    </div>
  </div>

  <div class="flex gap-2">
    {#if data.invoice.status !== 'paid' && data.invoice.status !== 'cancelled'}
      <button onclick={markPaid} disabled={marking} class="bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50">
        {marking ? 'Saving…' : 'Mark Paid'}
      </button>
    {/if}
    <a href="/api/invoices/{data.invoice.id}/pdf" target="_blank" class="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded transition-colors">
      Download PDF
    </a>
    <a href="/erp/invoices/{data.invoice.id}/edit" class="text-xs px-3 py-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">Edit Raw</a>
  </div>
</div>
