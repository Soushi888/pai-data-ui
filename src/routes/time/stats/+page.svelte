<script lang="ts">
  import * as d3 from 'd3'
  import { onMount } from 'svelte'

  let { data } = $props()

  let dayChartEl = $state<SVGSVGElement | null>(null)
  let catChartEl = $state<SVGSVGElement | null>(null)
  let projChartEl = $state<SVGSVGElement | null>(null)
  let monthChartEl = $state<SVGSVGElement | null>(null)

  const catColors: Record<string, string> = {
    billable: '#4ade80', 'r&d': '#60a5fa', marketing: '#c084fc',
    internal: '#9ca3af', training: '#fbbf24', sales: '#fb923c',
  }

  onMount(() => {
    // Hours per day bar chart
    if (dayChartEl && data.hoursByDay.length > 0) {
      const W = dayChartEl.clientWidth || 600, H = 180
      const margin = { top: 10, right: 10, bottom: 40, left: 35 }
      const w = W - margin.left - margin.right, h = H - margin.top - margin.bottom
      const svg = d3.select(dayChartEl).attr('viewBox', `0 0 ${W} ${H}`)
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
      const x = d3.scaleBand().domain(data.hoursByDay.map(d => d.date)).range([0, w]).padding(0.2)
      const y = d3.scaleLinear().domain([0, d3.max(data.hoursByDay, d => d.hours) ?? 1]).nice().range([h, 0])
      g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).tickValues(x.domain().filter((_,i) => i % Math.ceil(data.hoursByDay.length / 8) === 0)).tickFormat(d => d.slice(5))).call(a => a.select('.domain').remove()).call(a => a.selectAll('text').attr('fill', '#6b7280').attr('font-size', '10'))
      g.append('g').call(d3.axisLeft(y).ticks(4)).call(a => a.select('.domain').remove()).call(a => a.selectAll('text').attr('fill', '#6b7280').attr('font-size', '10')).call(a => a.selectAll('line').attr('stroke', '#374151'))
      g.selectAll('rect').data(data.hoursByDay).join('rect').attr('x', d => x(d.date) ?? 0).attr('y', d => y(d.hours)).attr('width', x.bandwidth()).attr('height', d => h - y(d.hours)).attr('fill', '#3b82f6').attr('rx', 2)
    }

    // Category donut
    if (catChartEl && data.hoursByCategory.length > 0) {
      const W = 300, H = 220
      const r = Math.min(W, H) / 2 - 20
      const svg = d3.select(catChartEl).attr('viewBox', `0 0 ${W} ${H}`)
      const g = svg.append('g').attr('transform', `translate(${W/2},${H/2})`)
      const pie = d3.pie<{category: string; hours: number}>().value(d => d.hours)
      const arc = d3.arc<d3.PieArcDatum<{category: string; hours: number}>>().innerRadius(r * 0.5).outerRadius(r)
      const arcs = g.selectAll('path').data(pie(data.hoursByCategory)).join('path').attr('d', arc).attr('fill', d => catColors[d.data.category] ?? '#6b7280').attr('stroke', '#111827').attr('stroke-width', 2)
      void arcs
    }

    // Projects horizontal bar chart
    if (projChartEl && data.hoursByProject.length > 0) {
      const W = projChartEl.clientWidth || 500, H = data.hoursByProject.length * 28 + 20
      const margin = { top: 5, right: 50, bottom: 5, left: 140 }
      const w = W - margin.left - margin.right, h = H - margin.top - margin.bottom
      const svg = d3.select(projChartEl).attr('viewBox', `0 0 ${W} ${H}`)
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
      const x = d3.scaleLinear().domain([0, d3.max(data.hoursByProject, d => d.hours) ?? 1]).range([0, w])
      const y = d3.scaleBand().domain(data.hoursByProject.map(d => d.label)).range([0, h]).padding(0.2)
      g.selectAll('rect').data(data.hoursByProject).join('rect').attr('x', 0).attr('y', d => y(d.label) ?? 0).attr('width', d => x(d.hours)).attr('height', y.bandwidth()).attr('fill', '#3b82f6').attr('rx', 2)
      g.selectAll('.label').data(data.hoursByProject).join('text').attr('class', 'label').attr('x', -4).attr('y', d => (y(d.label) ?? 0) + y.bandwidth() / 2).attr('text-anchor', 'end').attr('dominant-baseline', 'middle').attr('fill', '#9ca3af').attr('font-size', 11).text(d => d.label)
      g.selectAll('.val').data(data.hoursByProject).join('text').attr('class', 'val').attr('x', d => x(d.hours) + 4).attr('y', d => (y(d.label) ?? 0) + y.bandwidth() / 2).attr('dominant-baseline', 'middle').attr('fill', '#6b7280').attr('font-size', 10).text(d => `${d.hours}h`)
    }

    // Monthly grouped bars
    if (monthChartEl && data.hoursByMonth.length > 0) {
      const W = monthChartEl.clientWidth || 600, H = 180
      const margin = { top: 10, right: 10, bottom: 40, left: 35 }
      const w = W - margin.left - margin.right, h = H - margin.top - margin.bottom
      const svg = d3.select(monthChartEl).attr('viewBox', `0 0 ${W} ${H}`)
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
      const months = data.hoursByMonth.map(d => d.month)
      const x0 = d3.scaleBand().domain(months).range([0, w]).padding(0.2)
      const x1 = d3.scaleBand().domain(['billable', 'other']).range([0, x0.bandwidth()]).padding(0.05)
      const maxH = d3.max(data.hoursByMonth, d => Math.max(d.billable, d.other)) ?? 1
      const y = d3.scaleLinear().domain([0, maxH]).nice().range([h, 0])
      g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x0).tickFormat(d => d.slice(0, 7))).call(a => a.select('.domain').remove()).call(a => a.selectAll('text').attr('fill', '#6b7280').attr('font-size', '10'))
      g.append('g').call(d3.axisLeft(y).ticks(4)).call(a => a.select('.domain').remove()).call(a => a.selectAll('text').attr('fill', '#6b7280').attr('font-size', '10'))
      const groups = g.selectAll('.month').data(data.hoursByMonth).join('g').attr('class', 'month').attr('transform', d => `translate(${x0(d.month)},0)`)
      groups.append('rect').attr('x', x1('billable') ?? 0).attr('y', d => y(d.billable)).attr('width', x1.bandwidth()).attr('height', d => h - y(d.billable)).attr('fill', '#4ade80').attr('rx', 2)
      groups.append('rect').attr('x', x1('other') ?? 0).attr('y', d => y(d.other)).attr('width', x1.bandwidth()).attr('height', d => h - y(d.other)).attr('fill', '#6b7280').attr('rx', 2)
    }
  })
</script>

<div class="p-6 max-w-5xl">
  <div class="flex items-center gap-3 mb-6">
    <a href="/time" class="text-gray-500 hover:text-gray-300 text-sm">← Time</a>
    <h1 class="text-xl font-semibold text-gray-200">Time Statistics</h1>
  </div>

  <div class="grid grid-cols-2 gap-4 mb-8">
    <div class="bg-gray-900 rounded border border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-1">Total (6 months)</p>
      <p class="text-2xl font-semibold text-gray-200 tabular-nums">{data.totalHours}h</p>
    </div>
    <div class="bg-gray-900 rounded border border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-1">Billable (6 months)</p>
      <p class="text-2xl font-semibold text-green-400 tabular-nums">{data.billableHours}h</p>
    </div>
  </div>

  <section class="mb-8">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Hours per Day (last 30 days)</h2>
    <div class="bg-gray-900 rounded border border-gray-800 p-4">
      <svg bind:this={dayChartEl} class="w-full"></svg>
    </div>
  </section>

  <div class="grid grid-cols-2 gap-6 mb-8">
    <section>
      <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">By Category</h2>
      <div class="bg-gray-900 rounded border border-gray-800 p-4">
        <svg bind:this={catChartEl} class="w-full max-w-xs mx-auto"></svg>
        <div class="mt-3 space-y-1">
          {#each data.hoursByCategory as { category, hours }}
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" style="background:{catColors[category] ?? '#6b7280'}"></span>
                <span class="text-gray-400">{category}</span>
              </div>
              <span class="text-gray-500 tabular-nums">{hours}h</span>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">By Project (top 8)</h2>
      <div class="bg-gray-900 rounded border border-gray-800 p-4">
        <svg bind:this={projChartEl} class="w-full"></svg>
      </div>
    </section>
  </div>

  <section class="mb-8">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Billable vs Other by Month</h2>
    <div class="bg-gray-900 rounded border border-gray-800 p-4">
      <svg bind:this={monthChartEl} class="w-full"></svg>
      <div class="flex gap-4 mt-2 text-xs">
        <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm bg-green-400 inline-block"></span><span class="text-gray-500">billable</span></div>
        <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm bg-gray-500 inline-block"></span><span class="text-gray-500">other</span></div>
      </div>
    </div>
  </section>
</div>
