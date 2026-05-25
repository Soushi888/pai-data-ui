<script lang="ts">
  import * as d3 from 'd3'
  import { untrack } from 'svelte'
  import type { SkillLink, SkillNode } from '$lib/data/skills.js'

  interface SimNode extends SkillNode {
    x?: number
    y?: number
    vx?: number
    vy?: number
    fx?: number | null
    fy?: number | null
  }

  interface SimLink {
    source: string | SimNode
    target: string | SimNode
    type: 'feeds-into' | 'parent'
  }

  interface Props {
    nodes: SkillNode[]
    links: SkillLink[]
    highlightIds: Set<string>
    onNodeClick: (node: SkillNode) => void
  }

  let { nodes, links, highlightIds, onNodeClick }: Props = $props()

  let svgEl = $state<SVGSVGElement | null>(null)
  let graphVersion = $state(0)

  let _nodeGroupSel: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown> | null = null
  let _linkSel: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown> | null = null

  const CATEGORY_COLORS: Record<string, string> = {
    thinking: '#60a5fa',
    implementation: '#4ade80',
    content: '#c084fc',
    meta: '#fb923c',
    personal: '#f472b6',
    analysis: '#22d3ee',
    domain: '#facc15',
    utility: '#9ca3af',
  }

  const W = 1000
  const H = 680

  function assignComponents(
    simNodes: SimNode[],
    rawLinks: Array<{ source: string; target: string }>
  ): { compMap: Map<string, number>; numComps: number } {
    const parent = new Map(simNodes.map((n) => [n.id, n.id]))

    function find(x: string): string {
      const p = parent.get(x)!
      if (p !== x) parent.set(x, find(p))
      return parent.get(x)!
    }

    for (const { source: s, target: t } of rawLinks) {
      if (parent.has(s) && parent.has(t)) parent.set(find(s), find(t))
    }

    const rootIdx = new Map<string, number>()
    let idx = 0
    const compMap = new Map<string, number>()
    for (const n of simNodes) {
      const r = find(n.id)
      if (!rootIdx.has(r)) rootIdx.set(r, idx++)
      compMap.set(n.id, rootIdx.get(r)!)
    }
    return { compMap, numComps: Math.max(1, idx) }
  }

  $effect(() => {
    if (!svgEl) return
    const el = svgEl
    const inputNodes = nodes
    const inputLinks = links

    d3.select(el).selectAll('*').remove()
    _nodeGroupSel = null
    _linkSel = null

    const simNodes: SimNode[] = inputNodes.map((n) => ({ ...n }))
    const simLinks: SimLink[] = inputLinks.map((l) => ({
      source: l.source,
      target: l.target,
      type: l.type,
    }))

    const { compMap, numComps } = assignComponents(
      simNodes,
      inputLinks.map((l) => ({ source: l.source, target: l.target }))
    )

    const sim = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(70)
          .strength(0.8)
      )
      .force('charge', d3.forceManyBody<SimNode>().strength(-150))
      .force('collide', d3.forceCollide<SimNode>(24))
      .force(
        'x',
        d3
          .forceX<SimNode>((d) => {
            const c = compMap.get(d.id) ?? 0
            return ((c / numComps) - 0.5) * W * 0.82
          })
          .strength(0.08)
      )
      .force('y', d3.forceY<SimNode>(0).strength(0.03))

    const svg = d3.select(el)
    svg.attr('viewBox', `${-W / 2} ${-H / 2} ${W} ${H}`)

    const g = svg.append('g')

    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.15, 4])
        .on('zoom', (e) => g.attr('transform', e.transform))
    )

    const linkSel = g
      .append('g')
      .selectAll<SVGLineElement, SimLink>('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', (l) => (l.type === 'parent' ? '#4b5563' : '#374151'))
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', (l) => (l.type === 'parent' ? '4 2' : null))

    const nodeGroupSel = g
      .append('g')
      .selectAll<SVGGElement, SimNode>('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )
      .on('click', (_, d) => onNodeClick(d))

    nodeGroupSel
      .append('circle')
      .attr('r', 9)
      .attr('fill', (d) => CATEGORY_COLORS[d.category] ?? '#9ca3af')
      .attr('stroke', '#111827')
      .attr('stroke-width', 1.5)

    nodeGroupSel
      .append('text')
      .text((d) => d.name)
      .attr('x', 12)
      .attr('y', '0.35em')
      .attr('font-size', '10px')
      .attr('fill', '#d1d5db')
      .attr('pointer-events', 'none')

    sim.on('tick', () => {
      linkSel
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0)

      nodeGroupSel.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    _linkSel = linkSel
    _nodeGroupSel = nodeGroupSel
    untrack(() => {
      graphVersion++
    })

    return () => sim.stop()
  })

  $effect(() => {
    void graphVersion
    const ids = highlightIds
    const ns = _nodeGroupSel
    const ls = _linkSel
    if (!ns || !ls) return
    const active = ids.size > 0
    ns.style('opacity', (d) => (active && !ids.has(d.id) ? '0.08' : '1'))
    ls.style('opacity', () => (active ? '0.08' : '1'))
  })
</script>

<svg bind:this={svgEl} class="w-full h-full" />
