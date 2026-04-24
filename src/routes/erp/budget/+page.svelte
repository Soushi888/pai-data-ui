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

  // ── Grouped bar chart (income vs expenses) ─────────────────────────────────
  const BAR_W = 680
  const BAR_H = 200
  const BAR_M = { top: 12, right: 16, bottom: 36, left: 68 }
  const barInnerW = BAR_W - BAR_M.left - BAR_M.right
  const barInnerH = BAR_H - BAR_M.top - BAR_M.bottom

  const xScale = $derived(
    scaleBand()
      .domain(data.expensesByMonth.map((d) => d.month))
      .range([0, barInnerW])
      .padding(0.2)
  )
  const xSub = $derived(
    scaleBand()
      .domain(['income', 'expenses'])
      .range([0, xScale.bandwidth()])
      .padding(0.05)
  )
  const barYMax = $derived(
    max(data.expensesByMonth, (d) => Math.max(d.income, d.expenses)) ?? 0
  )
  const yBarScale = $derived(
    scaleLinear().domain([0, barYMax * 1.1]).range([barInnerH, 0]).nice()
  )
  const yBarTicks = $derived(yBarScale.ticks(4))

  // ── Donut chart (category breakdown) ──────────────────────────────────────
  const DONUT_SIZE = 220
  const DONUT_R = DONUT_SIZE / 2
  const DONUT_INNER_R = DONUT_R * 0.55
  const categoryColors: Record<string, string> = {
    housing: '#3b82f6',
    utilities: '#22c55e',
    subscriptions: '#a855f7',
    transport: '#f59e0b',
    food: '#ef4444',
    health: '#14b8a6',
    other: '#6b7280'
  }

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
  const donutTotal = $derived(data.expensesByCategory.reduce((s, d) => s + d.amount, 0))

  // ── Line chart (cost of living) ────────────────────────────────────────────
  const LINE_W = 680
  const LINE_H = 180
  const LINE_M = { top: 12, right: 16, bottom: 32, left: 68 }
  const lineInnerW = LINE_W - LINE_M.left - LINE_M.right
  const lineInnerH = LINE_H - LINE_M.top - LINE_M.bottom

  const lineXScale = $derived(
    scaleBand()
      .domain(data.costOfLiving.map((d) => d.month))
      .range([0, lineInnerW])
      .padding(0)
  )
  const lineYMax = $derived(max(data.costOfLiving, (d) => d.amount) ?? 0)
  const lineYScale = $derived(
    scaleLinear().domain([0, lineYMax * 1.15]).range([lineInnerH, 0]).nice()
  )
  const lineYTicks = $derived(lineYScale.ticks(4))

  const linePath = $derived(() => {
    if (data.costOfLiving.length < 2) return ''
    const pts = data.costOfLiving.map((d) => {
      const x = (lineXScale(d.month) ?? 0) + lineXScale.bandwidth() / 2
      const y = lineYScale(d.amount)
      return `${x},${y}`
    })
    return 'M' + pts.join('L')
  })
</script>

<div class="p-6 max-w-4xl">
  <h1 class="text-xl font-semibold text-gray-100 mb-6">Budget</h1>

  <!-- Summary cards -->
  <div class="grid grid-cols-4 gap-3 mb-8">
    {#each [
      { label: 'Monthly Committed', value: data.monthlyCommitted, color: 'text-blue-300' },
      { label: 'Actual This Month', value: data.actualThisMonth, color: 'text-orange-300' },
      { label: 'Income This Month', value: data.incomeThisMonth, color: 'text-green-300' },
      { label: 'Net Balance', value: data.netBalance, color: data.netBalance >= 0 ? 'text-green-300' : 'text-red-300' }
    ] as card}
      <div class="bg-gray-900 rounded border border-gray-800 p-3">
        <p class="text-xs text-gray-500 mb-1">{card.label}</p>
        <p class="text-lg font-semibold tabular-nums {card.color}">{cad(card.value)}</p>
      </div>
    {/each}
  </div>

  <!-- Chart 1: Income vs Expenses bar chart -->
  <div class="mb-8">
    <h2 class="text-sm font-semibold text-gray-400 mb-3">Income vs. Expenses — Last 12 Months</h2>
    {#if data.expensesByMonth.length > 0}
      <svg width={BAR_W} height={BAR_H} class="overflow-visible">
        <g transform="translate({BAR_M.left},{BAR_M.top})">
          {#each yBarTicks as tick}
            <line x1={0} x2={barInnerW} y1={yBarScale(tick)} y2={yBarScale(tick)} stroke="#374151" stroke-width="1" />
            <text x={-6} y={yBarScale(tick)} dy="0.32em" text-anchor="end" fill="#6b7280" font-size="11">{cad(tick)}</text>
          {/each}
          {#each data.expensesByMonth as d}
            {@const x = xScale(d.month) ?? 0}
            <rect
              x={x + (xSub('income') ?? 0)}
              y={yBarScale(d.income)}
              width={xSub.bandwidth()}
              height={barInnerH - yBarScale(d.income)}
              fill="#22c55e"
              opacity="0.75"
            />
            <rect
              x={x + (xSub('expenses') ?? 0)}
              y={yBarScale(d.expenses)}
              width={xSub.bandwidth()}
              height={barInnerH - yBarScale(d.expenses)}
              fill="#f97316"
              opacity="0.75"
            />
            <text x={x + xScale.bandwidth() / 2} y={barInnerH + 18} text-anchor="middle" fill="#6b7280" font-size="10">{fmtMonth(d.month)}</text>
          {/each}
          <line x1={0} x2={barInnerW} y1={barInnerH} y2={barInnerH} stroke="#374151" />
        </g>
      </svg>
      <div class="flex gap-4 mt-1 text-xs text-gray-500">
        <span><span class="inline-block w-2 h-2 rounded-sm bg-green-500 mr-1"></span>Income</span>
        <span><span class="inline-block w-2 h-2 rounded-sm bg-orange-500 mr-1"></span>Expenses</span>
      </div>
    {:else}
      <p class="text-sm text-gray-600">No payment data yet.</p>
    {/if}
  </div>

  <!-- Chart 2: Donut chart + Chart 3: Line chart side by side -->
  <div class="flex gap-8 mb-8">
    <!-- Donut -->
    <div class="flex-shrink-0">
      <h2 class="text-sm font-semibold text-gray-400 mb-3">Expense Breakdown (Annual)</h2>
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
        <div class="mt-2 space-y-1">
          {#each data.expensesByCategory as d}
            <div class="flex items-center gap-1.5 text-xs text-gray-400">
              <span class="inline-block w-2 h-2 rounded-sm flex-shrink-0" style="background:{categoryColors[d.category] ?? '#6b7280'}"></span>
              <span class="flex-1">{d.category}</span>
              <span class="tabular-nums text-gray-300">{cad(d.amount)}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-gray-600">No active monthly expenses.</p>
      {/if}
    </div>

    <!-- Line chart -->
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
              points={data.costOfLiving.map((d) => {
                const x = (lineXScale(d.month) ?? 0) + lineXScale.bandwidth() / 2
                const y = lineYScale(d.amount)
                return `${x},${y}`
              }).join(' ')}
              fill="none"
              stroke="#60a5fa"
              stroke-width="2"
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

  <!-- Chart 4: Upcoming -->
  <div>
    <h2 class="text-sm font-semibold text-gray-400 mb-3">Upcoming — Next 6 Months</h2>
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
            <tr class="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer" onclick={() => window.location.href = `/erp/expenses/${e.id}`}>
              <td class="py-2.5 text-blue-400">{e.name}</td>
              <td class="py-2.5 text-gray-500">{e.recurrence}</td>
              <td class="py-2.5 text-gray-400 tabular-nums">{e.next_due ?? ''}</td>
              <td class="py-2.5 text-right tabular-nums text-gray-200">{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(e.amount_cad)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p class="text-sm text-gray-600">No upcoming one-time or annual expenses in the next 6 months.</p>
    {/if}
  </div>
</div>
