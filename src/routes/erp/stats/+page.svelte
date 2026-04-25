<script lang="ts">
  import { scaleBand, scaleLinear, max, arc, pie } from 'd3'

  let { data } = $props()

  const cad = (n: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

  function fmtMonth(ym: string): string {
    const [y, m] = ym.split('-')
    const d = new Date(+y, +m - 1, 1)
    return d.toLocaleString('fr-CA', { month: 'short', year: '2-digit' })
  }

  const statusColors: Record<string, string> = {
    paid: '#22c55e',
    sent: '#60a5fa',
    draft: '#6b7280',
    overdue: '#ef4444',
    cancelled: '#374151'
  }

  const categoryColors: Record<string, string> = {
    housing: '#3b82f6',
    utilities: '#22c55e',
    subscriptions: '#a855f7',
    transport: '#f59e0b',
    food: '#ef4444',
    health: '#14b8a6',
    other: '#6b7280'
  }

  // ── Section 3: Cash Flow ──────────────────────────────────────────────────
  const CF_W = 700
  const CF_H = 200
  const CF_M = { top: 12, right: 16, bottom: 36, left: 68 }
  const cfInnerW = CF_W - CF_M.left - CF_M.right
  const cfInnerH = CF_H - CF_M.top - CF_M.bottom

  const cfXScale = $derived(
    scaleBand()
      .domain(data.cashFlowByMonth.map((d) => d.month))
      .range([0, cfInnerW])
      .padding(0.2)
  )
  const cfXSub = $derived(
    scaleBand()
      .domain(['income', 'expenses'])
      .range([0, cfXScale.bandwidth()])
      .padding(0.05)
  )
  const cfYMax = $derived(max(data.cashFlowByMonth, (d) => Math.max(d.income, d.expenses)) ?? 0)
  const cfYScale = $derived(
    scaleLinear().domain([0, cfYMax * 1.1]).range([cfInnerH, 0]).nice()
  )
  const cfYTicks = $derived(cfYScale.ticks(4))

  // ── Section 4: Revenue by Month ───────────────────────────────────────────
  const availableYears = $derived([
    'All',
    ...Array.from(new Set(data.monthlyRevenue.map((d: { month: string }) => d.month.slice(0, 4))))
      .sort()
      .reverse()
  ])
  let selectedYear = $state('All')

  const filteredRevenue = $derived(
    selectedYear === 'All'
      ? data.monthlyRevenue
      : data.monthlyRevenue.filter((d: { month: string }) => d.month.startsWith(selectedYear))
  )

  const REV_W = 700
  const REV_H = 220
  const REV_M = { top: 16, right: 16, bottom: 36, left: 72 }
  const revInnerW = REV_W - REV_M.left - REV_M.right
  const revInnerH = REV_H - REV_M.top - REV_M.bottom

  const revXScale = $derived(
    scaleBand()
      .domain(filteredRevenue.map((d: { month: string }) => d.month))
      .range([0, revInnerW])
      .padding(0.25)
  )
  const revYMax = $derived(max(filteredRevenue, (d: { total: number }) => d.total) ?? 0)
  const revYScale = $derived(
    scaleLinear().domain([0, revYMax * 1.1]).range([revInnerH, 0]).nice()
  )
  const revYTicks = $derived(revYScale.ticks(5))

  // Revenue by Organization
  const ORG_H = $derived(data.orgData.length * 36 + 32)
  const orgXMax = $derived(max(data.orgData, (d: { total: number }) => d.total) ?? 0)
  const ORG_LABEL_W = 180
  const ORG_BAR_W = 400

  const orgXScale = $derived(
    scaleLinear().domain([0, orgXMax * 1.1]).range([0, ORG_BAR_W]).nice()
  )

  // ── Section 5: Donut chart ─────────────────────────────────────────────────
  const DONUT_SIZE = 200
  const DONUT_R = DONUT_SIZE / 2
  const DONUT_INNER_R = DONUT_R * 0.55

  const arcGen = $derived(
    arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(DONUT_INNER_R)
      .outerRadius(DONUT_R - 4)
  )
  const pieLayout = $derived(
    pie<{ category: string; amount: number }>()
      .value((d) => d.amount)
      .sort(null)
  )
  const pieData = $derived(pieLayout(data.expensesByCategory))
  const donutTotal = $derived(data.expensesByCategory.reduce((s: number, d: { amount: number }) => s + d.amount, 0))

  // Cost of Living line chart
  const LINE_W = 560
  const LINE_H = 180
  const LINE_M = { top: 12, right: 16, bottom: 32, left: 68 }
  const lineInnerW = LINE_W - LINE_M.left - LINE_M.right
  const lineInnerH = LINE_H - LINE_M.top - LINE_M.bottom

  const lineXScale = $derived(
    scaleBand()
      .domain(data.costOfLiving.map((d: { month: string }) => d.month))
      .range([0, lineInnerW])
      .padding(0)
  )
  const lineYMax = $derived(max(data.costOfLiving, (d: { amount: number }) => d.amount) ?? 0)
  const lineYScale = $derived(
    scaleLinear().domain([0, lineYMax * 1.15]).range([lineInnerH, 0]).nice()
  )
  const lineYTicks = $derived(lineYScale.ticks(4))

  // ── Hover states ───────────────────────────────────────────────────────────
  let hoveredMonth = $state<string | null>(null)
  let hoveredOrg = $state<string | null>(null)
</script>

<div class="p-6 max-w-5xl">
  <div class="flex items-center gap-4 mb-8">
    <a href="/erp" class="text-gray-500 hover:text-gray-300 text-sm">← Invoices</a>
    <h1 class="text-xl font-semibold text-gray-100">ERP Stats</h1>
  </div>

  <!-- SECTION 1: THIS MONTH -->
  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">This Month</p>
  <div class="grid grid-cols-4 gap-4 mb-8">
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">Income</p>
      <p class="text-2xl font-bold text-green-300">{cad(data.incomeThisMonth)}</p>
    </div>
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">Expenses</p>
      <p class="text-2xl font-bold text-orange-300">{cad(data.actualThisMonth)}</p>
    </div>
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">Net Balance</p>
      <p class="text-2xl font-bold {data.netBalance >= 0 ? 'text-green-300' : 'text-red-300'}">{cad(data.netBalance)}</p>
    </div>
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">Savings Rate</p>
      {#if data.savingsRate !== null}
        <p class="text-2xl font-bold {data.savingsRate >= 0 ? 'text-blue-300' : 'text-red-300'}">{data.savingsRate}%</p>
      {:else}
        <p class="text-2xl font-bold text-gray-600">N/A</p>
      {/if}
    </div>
  </div>

  <!-- SECTION 2: YTD / ALL-TIME -->
  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Year to Date / All Time</p>
  <div class="grid grid-cols-4 gap-4 mb-8">
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">YTD {data.currentYear}</p>
      <p class="text-2xl font-bold text-green-400">{cad(data.ytdTotal)}</p>
    </div>
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">All-time (paid)</p>
      <p class="text-2xl font-bold text-gray-100">{cad(data.grandTotal)}</p>
    </div>
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">Monthly Committed</p>
      <p class="text-2xl font-bold text-blue-300">{cad(data.monthlyCommitted)}</p>
    </div>
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-2">Invoices ({data.totalInvoices})</p>
      <div class="flex flex-col gap-1">
        {#each Object.entries(data.byStatus) as [status, count]}
          <div class="flex items-center justify-between">
            <span class="text-xs" style="color: {statusColors[status] ?? '#9ca3af'}">{status}</span>
            <span class="text-xs text-gray-400 tabular-nums">{count}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- SECTION 3: CASH FLOW -->
  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cash Flow — Last 12 Months</p>
  <div class="bg-gray-900 rounded-lg border border-gray-800 p-5 mb-8">
    {#if data.cashFlowByMonth.length > 0}
      <svg width={CF_W} height={CF_H} class="overflow-visible">
        <g transform="translate({CF_M.left},{CF_M.top})">
          {#each cfYTicks as tick}
            <line x1={0} x2={cfInnerW} y1={cfYScale(tick)} y2={cfYScale(tick)} stroke="#374151" stroke-width="1" />
            <text x={-6} y={cfYScale(tick)} dy="0.32em" text-anchor="end" fill="#6b7280" font-size="11">{cad(tick)}</text>
          {/each}
          {#each data.cashFlowByMonth as d}
            {@const x = cfXScale(d.month) ?? 0}
            <rect
              x={x + (cfXSub('income') ?? 0)}
              y={cfYScale(d.income)}
              width={cfXSub.bandwidth()}
              height={cfInnerH - cfYScale(d.income)}
              fill="#22c55e" opacity="0.75"
            />
            <rect
              x={x + (cfXSub('expenses') ?? 0)}
              y={cfYScale(d.expenses)}
              width={cfXSub.bandwidth()}
              height={cfInnerH - cfYScale(d.expenses)}
              fill="#f97316" opacity="0.75"
            />
            <text x={x + cfXScale.bandwidth() / 2} y={cfInnerH + 18} text-anchor="middle" fill="#6b7280" font-size="10">{fmtMonth(d.month)}</text>
          {/each}
          <line x1={0} x2={cfInnerW} y1={cfInnerH} y2={cfInnerH} stroke="#374151" />
        </g>
      </svg>
      <div class="flex gap-4 mt-2 text-xs text-gray-500">
        <span><span class="inline-block w-2 h-2 rounded-sm bg-green-500 mr-1"></span>Income</span>
        <span><span class="inline-block w-2 h-2 rounded-sm bg-orange-500 mr-1"></span>Expenses</span>
      </div>
    {:else}
      <p class="text-sm text-gray-600">No data yet.</p>
    {/if}
  </div>

  <!-- SECTION 4: REVENUE BREAKDOWN -->
  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Revenue Breakdown</p>

  <div class="bg-gray-900 rounded-lg border border-gray-800 p-5 mb-5">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Revenue by Month</h2>
      <div class="flex gap-1">
        {#each availableYears as y}
          <button
            onclick={() => (selectedYear = y)}
            class="px-2 py-0.5 rounded text-xs transition-colors {selectedYear === y ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
          >{y}</button>
        {/each}
      </div>
    </div>
    {#if filteredRevenue.length === 0}
      <p class="text-gray-600 text-sm">No data{selectedYear !== 'All' ? ` for ${selectedYear}` : ''}.</p>
    {:else}
      <svg width={REV_W} height={REV_H} class="overflow-visible">
        <g transform="translate({REV_M.left},{REV_M.top})">
          {#each revYTicks as tick}
            <line x1={0} x2={revInnerW} y1={revYScale(tick)} y2={revYScale(tick)} stroke="#1f2937" stroke-width="1" />
            <text x={-8} y={revYScale(tick)} text-anchor="end" dominant-baseline="middle" fill="#6b7280" font-size="11">{cad(tick)}</text>
          {/each}
          {#each filteredRevenue as d}
            {@const bx = revXScale(d.month) ?? 0}
            {@const bw = revXScale.bandwidth()}
            {@const by = revYScale(d.total)}
            {@const bh = revInnerH - by}
            <rect
              x={bx} y={by} width={bw} height={bh} rx="3"
              fill={hoveredMonth === d.month ? '#3b82f6' : '#1d4ed8'}
              opacity={hoveredMonth && hoveredMonth !== d.month ? 0.4 : 1}
              class="cursor-pointer transition-opacity"
              onmouseenter={() => (hoveredMonth = d.month)}
              onmouseleave={() => (hoveredMonth = null)}
            />
            {#if hoveredMonth === d.month}
              <text x={bx + bw / 2} y={by - 6} text-anchor="middle" font-size="11" fill="#93c5fd">{cad(d.total)}</text>
            {/if}
            <text x={bx + bw / 2} y={revInnerH + 20} text-anchor="middle" font-size="10" fill="#6b7280">{fmtMonth(d.month)}</text>
          {/each}
          <line x1={0} x2={revInnerW} y1={revInnerH} y2={revInnerH} stroke="#374151" stroke-width="1" />
        </g>
      </svg>
    {/if}
  </div>

  <div class="bg-gray-900 rounded-lg border border-gray-800 p-5 mb-8">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Revenue by Organization</h2>
    {#if data.orgData.length === 0}
      <p class="text-gray-600 text-sm">No data.</p>
    {:else}
      <svg width={ORG_LABEL_W + ORG_BAR_W + 100} height={ORG_H} class="overflow-visible">
        {#each data.orgData as d, i}
          {@const y = i * 36 + 16}
          {@const bw = orgXScale(d.total)}
          <text
            x={ORG_LABEL_W - 8} y={y + 11} text-anchor="end" font-size="12"
            fill={hoveredOrg === d.org ? '#93c5fd' : '#9ca3af'}
          >{d.org}</text>
          <rect
            x={ORG_LABEL_W} y={y} width={bw} height={22} rx="3"
            fill={hoveredOrg === d.org ? '#3b82f6' : '#1e40af'}
            opacity={hoveredOrg && hoveredOrg !== d.org ? 0.4 : 1}
            class="cursor-pointer transition-opacity"
            onmouseenter={() => (hoveredOrg = d.org)}
            onmouseleave={() => (hoveredOrg = null)}
          />
          <text x={ORG_LABEL_W + bw + 8} y={y + 14} font-size="11" fill={hoveredOrg === d.org ? '#93c5fd' : '#6b7280'}>
            {cad(d.total)} <tspan fill="#4b5563">({d.count})</tspan>
          </text>
        {/each}
      </svg>
      <table class="w-full text-sm mt-6 border-t border-gray-800">
        <thead>
          <tr class="text-gray-500 text-left">
            <th class="py-2 font-normal">Organization</th>
            <th class="py-2 font-normal text-right">Invoices</th>
            <th class="py-2 font-normal text-right">Total</th>
            <th class="py-2 font-normal text-right">Share</th>
          </tr>
        </thead>
        <tbody>
          {#each data.orgData as d}
            <tr class="border-t border-gray-800 hover:bg-gray-800/30">
              <td class="py-2 text-gray-300">{d.org}</td>
              <td class="py-2 text-right text-gray-500 tabular-nums">{d.count}</td>
              <td class="py-2 text-right text-gray-200 tabular-nums">{cad(d.total)}</td>
              <td class="py-2 text-right text-gray-500 tabular-nums">
                {data.grandTotal > 0 ? Math.round((d.total / data.grandTotal) * 100) : 0}%
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  <!-- SECTION 5: EXPENSE BREAKDOWN -->
  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Expense Breakdown</p>
  <div class="flex gap-8 mb-8">
    <!-- Donut + category table -->
    <div class="w-[260px] flex-shrink-0">
      <h2 class="text-sm font-semibold text-gray-400 mb-3">By Category (Annual)</h2>
      {#if data.expensesByCategory.length > 0}
        <svg width={DONUT_SIZE} height={DONUT_SIZE}>
          <g transform="translate({DONUT_R},{DONUT_R})">
            {#each pieData as slice}
              <path
                d={arcGen({ startAngle: slice.startAngle, endAngle: slice.endAngle }) ?? ''}
                fill={categoryColors[slice.data.category] ?? '#6b7280'}
                opacity="0.85"
              />
            {/each}
            <text text-anchor="middle" dy="-0.2em" fill="#e5e7eb" font-size="14" font-weight="600">{cad(donutTotal)}</text>
            <text text-anchor="middle" dy="1.2em" fill="#6b7280" font-size="10">annual</text>
          </g>
        </svg>
        <table class="w-full text-xs mt-3">
          <thead>
            <tr class="text-gray-600 border-b border-gray-800">
              <th class="pb-1 font-normal text-left">Category</th>
              <th class="pb-1 font-normal text-right">Amount</th>
              <th class="pb-1 font-normal text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {#each data.expensesByCategory as d}
              <tr class="border-t border-gray-800">
                <td class="py-1 text-gray-400">
                  <span class="inline-block w-2 h-2 rounded-sm mr-1" style="background:{categoryColors[d.category] ?? '#6b7280'}"></span>{d.category}
                </td>
                <td class="py-1 text-right tabular-nums text-gray-300">{cad(d.amount)}</td>
                <td class="py-1 text-right tabular-nums text-gray-500">
                  {donutTotal > 0 ? Math.round((d.amount / donutTotal) * 100) : 0}%
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p class="text-sm text-gray-600">No active monthly expenses.</p>
      {/if}
    </div>

    <!-- Cost of Living line chart -->
    <div class="flex-1">
      <h2 class="text-sm font-semibold text-gray-400 mb-3">Cost of Living Evolution</h2>
      {#if data.costOfLiving.length > 1}
        <svg width={LINE_W} height={LINE_H} class="overflow-visible">
          <g transform="translate({LINE_M.left},{LINE_M.top})">
            {#each lineYTicks as tick}
              <line x1={0} x2={lineInnerW} y1={lineYScale(tick)} y2={lineYScale(tick)} stroke="#374151" stroke-width="1" />
              <text x={-6} y={lineYScale(tick)} dy="0.32em" text-anchor="end" fill="#6b7280" font-size="11">{cad(tick)}</text>
            {/each}
            <polyline
              points={data.costOfLiving.map((d: { month: string; amount: number }) => {
                const x = (lineXScale(d.month) ?? 0) + lineXScale.bandwidth() / 2
                const y = lineYScale(d.amount)
                return `${x},${y}`
              }).join(' ')}
              fill="none" stroke="#60a5fa" stroke-width="2"
            />
            {#each data.costOfLiving as d}
              {@const x = (lineXScale(d.month) ?? 0) + lineXScale.bandwidth() / 2}
              <circle cx={x} cy={lineYScale(d.amount)} r="3" fill="#60a5fa" />
            {/each}
            {#each data.costOfLiving as d, i}
              {#if i % Math.ceil(data.costOfLiving.length / 8) === 0}
                {@const x = (lineXScale(d.month) ?? 0) + lineXScale.bandwidth() / 2}
                <text x={x} y={lineInnerH + 18} text-anchor="middle" fill="#6b7280" font-size="10">{fmtMonth(d.month)}</text>
              {/if}
            {/each}
            <line x1={0} x2={lineInnerW} y1={lineInnerH} y2={lineInnerH} stroke="#374151" />
          </g>
        </svg>
      {:else if data.costOfLiving.length === 1}
        <p class="text-sm text-gray-600">Need 2+ months of payments for trend.</p>
      {:else}
        <p class="text-sm text-gray-600">No payment history yet.</p>
      {/if}
    </div>
  </div>

  <!-- SECTION 6: UPCOMING -->
  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming — Next 6 Months</p>
  {#if data.upcoming.length > 0}
    <table class="w-full text-sm">
      <thead>
        <tr class="text-gray-500 text-left">
          <th class="pb-2 font-normal">Name</th>
          <th class="pb-2 font-normal">Type</th>
          <th class="pb-2 font-normal">Due</th>
          <th class="pb-2 font-normal text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {#each data.upcoming as e}
          <tr
            class="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer"
            onclick={() => window.location.href = `/erp/expenses/${e.id}`}
          >
            <td class="py-2.5 text-blue-400">{e.name}</td>
            <td class="py-2.5 text-gray-500">{e.recurrence}</td>
            <td class="py-2.5 text-gray-400 tabular-nums">{e.next_due ?? ''}</td>
            <td class="py-2.5 text-right tabular-nums text-gray-200">
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(e.amount_cad)}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="text-sm text-gray-600">No upcoming one-time or annual expenses in the next 6 months.</p>
  {/if}
</div>
