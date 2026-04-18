<script lang="ts">
  import { scaleBand, scaleLinear, max } from 'd3'

  let { data } = $props()

  const cad = (n: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

  const statusColors: Record<string, string> = {
    paid: '#22c55e',
    sent: '#60a5fa',
    draft: '#6b7280',
    overdue: '#ef4444',
    cancelled: '#374151'
  }

  // Monthly bar chart dimensions
  const W = 700
  const H = 220
  const MARGIN = { top: 16, right: 16, bottom: 36, left: 72 }
  const innerW = $derived(W - MARGIN.left - MARGIN.right)
  const innerH = $derived(H - MARGIN.top - MARGIN.bottom)

  const xScale = $derived(
    scaleBand()
      .domain(data.monthlyData.map((d: { month: string }) => d.month))
      .range([0, innerW])
      .padding(0.25)
  )

  const yMax = $derived(max(data.monthlyData, (d: { total: number }) => d.total) ?? 0)
  const yScale = $derived(
    scaleLinear()
      .domain([0, yMax * 1.1])
      .range([innerH, 0])
      .nice()
  )

  // Y axis ticks
  const yTicks = $derived(yScale.ticks(5))

  // X label formatter — show short month name
  function fmtMonth(ym: string): string {
    const [y, m] = ym.split('-')
    const date = new Date(+y, +m - 1, 1)
    return date.toLocaleString('fr-CA', { month: 'short', year: '2-digit' })
  }

  // Org bar chart
  const ORG_H = $derived(data.orgData.length * 36 + 32)
  const orgXMax = $derived(max(data.orgData, (d: { total: number }) => d.total) ?? 0)
  const ORG_LABEL_W = 180
  const ORG_BAR_W = 400

  const orgXScale = $derived(
    scaleLinear()
      .domain([0, orgXMax * 1.1])
      .range([0, ORG_BAR_W])
      .nice()
  )

  let hoveredMonth = $state<string | null>(null)
  let hoveredOrg = $state<string | null>(null)
</script>

<div class="p-6 max-w-4xl">
  <div class="flex items-center gap-4 mb-6">
    <a href="/erp" class="text-gray-500 hover:text-gray-300 text-sm">← Invoices</a>
    <h1 class="text-xl font-semibold text-gray-100">Revenue Stats</h1>
  </div>

  <!-- Summary stats -->
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
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">Total invoices</p>
      <p class="text-2xl font-bold text-gray-100">{data.totalInvoices}</p>
    </div>
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-2">By status</p>
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

  <!-- Monthly revenue bar chart -->
  <div class="bg-gray-900 rounded-lg border border-gray-800 p-5 mb-6">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Revenue by Month</h2>

    {#if data.monthlyData.length === 0}
      <p class="text-gray-600 text-sm">No data.</p>
    {:else}
      <svg width={W} height={H} class="overflow-visible">
        <g transform="translate({MARGIN.left},{MARGIN.top})">
          <!-- Y grid lines + labels -->
          {#each yTicks as tick}
            <line
              x1={0} x2={innerW}
              y1={yScale(tick)} y2={yScale(tick)}
              stroke="#1f2937" stroke-width="1"
            />
            <text
              x={-8} y={yScale(tick)}
              text-anchor="end" dominant-baseline="middle"
              class="text-xs fill-gray-500" font-size="11"
              fill="#6b7280"
            >{cad(tick)}</text>
          {/each}

          <!-- Bars -->
          {#each data.monthlyData as d}
            {@const bx = xScale(d.month) ?? 0}
            {@const bw = xScale.bandwidth()}
            {@const by = yScale(d.total)}
            {@const bh = innerH - by}
            <rect
              x={bx} y={by}
              width={bw} height={bh}
              rx="3"
              fill={hoveredMonth === d.month ? '#3b82f6' : '#1d4ed8'}
              opacity={hoveredMonth && hoveredMonth !== d.month ? 0.4 : 1}
              class="cursor-pointer transition-opacity"
              onmouseenter={() => (hoveredMonth = d.month)}
              onmouseleave={() => (hoveredMonth = null)}
            />
            <!-- Value label on hover -->
            {#if hoveredMonth === d.month}
              <text
                x={bx + bw / 2} y={by - 6}
                text-anchor="middle" font-size="11"
                fill="#93c5fd"
              >{cad(d.total)}</text>
            {/if}

            <!-- X axis label -->
            <text
              x={bx + bw / 2} y={innerH + 20}
              text-anchor="middle" font-size="10"
              fill="#6b7280"
            >{fmtMonth(d.month)}</text>
          {/each}

          <!-- X axis line -->
          <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="#374151" stroke-width="1" />
        </g>
      </svg>
    {/if}
  </div>

  <!-- Per-organization breakdown -->
  <div class="bg-gray-900 rounded-lg border border-gray-800 p-5">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Revenue by Organization</h2>

    {#if data.orgData.length === 0}
      <p class="text-gray-600 text-sm">No data.</p>
    {:else}
      <svg width={ORG_LABEL_W + ORG_BAR_W + 100} height={ORG_H} class="overflow-visible">
        {#each data.orgData as d, i}
          {@const y = i * 36 + 16}
          {@const bw = orgXScale(d.total)}

          <!-- Org label -->
          <text
            x={ORG_LABEL_W - 8} y={y + 11}
            text-anchor="end" font-size="12"
            fill={hoveredOrg === d.org ? '#93c5fd' : '#9ca3af'}
          >{d.org}</text>

          <!-- Bar -->
          <rect
            x={ORG_LABEL_W} y={y}
            width={bw} height={22}
            rx="3"
            fill={hoveredOrg === d.org ? '#3b82f6' : '#1e40af'}
            opacity={hoveredOrg && hoveredOrg !== d.org ? 0.4 : 1}
            class="cursor-pointer transition-opacity"
            onmouseenter={() => (hoveredOrg = d.org)}
            onmouseleave={() => (hoveredOrg = null)}
          />

          <!-- Value label -->
          <text
            x={ORG_LABEL_W + bw + 8} y={y + 14}
            font-size="11"
            fill={hoveredOrg === d.org ? '#93c5fd' : '#6b7280'}
          >{cad(d.total)} <tspan fill="#4b5563">({d.count})</tspan></text>
        {/each}
      </svg>

      <!-- Table summary below -->
      <table class="w-full text-sm mt-6 border-t border-gray-800 pt-4">
        <thead>
          <tr class="text-gray-500 text-left">
            <th class="pb-2 font-normal">Organization</th>
            <th class="pb-2 font-normal text-right">Invoices</th>
            <th class="pb-2 font-normal text-right">Total</th>
            <th class="pb-2 font-normal text-right">Share</th>
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
</div>
