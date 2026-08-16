/**
 * PROTOTYPE: flowchart layout via elkjs instead of the rule-based router.
 *
 * ELK's layered algorithm with orthogonal edge routing produces exactly the
 * geometry a terminal can draw — axis-aligned segments, right-angle bends,
 * channel-allocated parallel edges, and cluster-piercing routes. This module
 * feeds it our parsed graph with sizes in cell units, snaps the result to
 * the character grid, and draws with the existing canvas machinery.
 *
 * Async because elkjs is: `renderElk(src)` returns a Promise. Not exported
 * from the package index; an experiment.
 */

import ELK, { type ElkExtendedEdge, type ElkLabel, type ElkNode } from 'elkjs'
import { Canvas, D, drawTextOverEdges, L, R, STY_DOT, STY_SOLID, STY_THICK, U } from './canvas.ts'
import { parseGraph } from './diagrams/flowchart.ts'
import type { Edge } from './graph.ts'
import { fitLabel, MAX_LABEL, MAX_LINES, stripControls, WRAP_WIDTH, wrapLabel } from './labels.ts'
import { drawBox, half, headGlyph, MAX_CANVAS_CELLS, sat } from './layout.ts'
import type { MermaidArt } from './types.ts'
import { stringWidth } from './width.ts'

// elkjs's own Node worker glue predates bun; hand it the runtime's Worker.
const elk = new ELK({
  workerFactory: () => new Worker(import.meta.resolve('elkjs/lib/elk-worker.min.js')),
})

/** Cell-unit spacing fed to ELK. Rows are half as many as columns for the
 * same visual distance — terminal cells are roughly 1:2. */
const OPTS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.spacing.nodeNodeBetweenLayers': '4',
  'elk.layered.spacing.edgeNodeBetweenLayers': '2',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '1',
  'elk.spacing.nodeNode': '6',
  'elk.spacing.edgeNode': '3',
  'elk.spacing.edgeEdge': '2',
  'elk.spacing.edgeLabel': '1',
  'elk.padding': '[top=2,left=2,bottom=1,right=2]',
}

const DIR: Record<string, string> = { down: 'DOWN', up: 'UP', right: 'RIGHT', left: 'LEFT' }

export async function renderElk(src: string): Promise<MermaidArt | null> {
  src = stripControls(src)
  const graph = parseGraph(src)
  if (graph === null) return null

  // Node ids in the ELK graph: `n<i>` for nodes, `g<i>` for groups. A node
  // whose id matches a group id proxies that group.
  const proxy = new Map<number, number>()
  graph.groups.forEach((g, gi) => {
    const ni = graph.index.get(g.id)
    if (ni !== undefined) proxy.set(ni, gi)
  })

  const wrapped = graph.nodes.map((n) => wrapLabel(n.label, WRAP_WIDTH, MAX_LINES))
  const leafNode = (i: number): ElkNode => {
    const lines = wrapped[i]
    const w = Math.max(1, ...lines.map(stringWidth)) + 4
    return { id: `n${i}`, width: w, height: lines.length + 2 }
  }

  // Group tree: each group's ELK node carries its children; its title is an
  // ELK label so the padding accounts for it.
  const groupChildren: number[][] = graph.groups.map(() => [])
  graph.groups.forEach((g, gi) => {
    if (g.parent !== null) groupChildren[g.parent].push(gi)
  })
  const nodesOf: number[][] = graph.groups.map(() => [])
  const topNodes: number[] = []
  graph.nodeGroup.forEach((g, ni) => {
    if (proxy.has(ni)) return
    if (g === null) topNodes.push(ni)
    else nodesOf[g].push(ni)
  })
  const buildGroup = (gi: number): ElkNode => ({
    id: `g${gi}`,
    labels: [
      { text: graph.groups[gi].label, width: stringWidth(graph.groups[gi].label) + 2, height: 1 },
    ],
    layoutOptions: { ...OPTS, 'elk.nodeLabels.placement': '[H_LEFT, V_TOP, OUTSIDE]' },
    children: [...nodesOf[gi].map(leafNode), ...groupChildren[gi].map(buildGroup)],
  })

  const elkId = (ni: number): string => {
    const gi = proxy.get(ni)
    return gi === undefined ? `n${ni}` : `g${gi}`
  }
  const edges: ElkExtendedEdge[] = graph.edges.map((e, i) => {
    const labels: ElkLabel[] = []
    const text = [e.cardFrom ?? '', e.label ?? '', e.cardTo ?? ''].filter(Boolean).join(' ')
    if (text !== '') {
      const t = fitLabel(text, MAX_LABEL)
      labels.push({ text: t, width: stringWidth(t) + 2, height: 1 })
    }
    return { id: `e${i}`, sources: [elkId(e.from)], targets: [elkId(e.to)], labels }
  })

  const root: ElkNode = {
    id: 'root',
    layoutOptions: {
      ...OPTS,
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.direction': DIR[graph.dir] ?? 'DOWN',
    },
    children: [
      ...topNodes.map(leafNode),
      ...graph.groups
        .map((_, gi) => gi)
        .filter((gi) => graph.groups[gi].parent === null)
        .map(buildGroup),
    ],
    edges,
  }

  const laid = await elk.layout(root)

  const W = Math.ceil(laid.width ?? 1) + 1
  const H = Math.ceil(laid.height ?? 1) + 1
  if (W * H > MAX_CANVAS_CELLS) return null
  const canvas = new Canvas(W, H)

  // --- boxes, frames, titles (children carry parent-relative coords) ------
  const r = Math.round
  const drawNode = (n: ElkNode, ox: number, oy: number): void => {
    const x = r((n.x ?? 0) + ox)
    const y = r((n.y ?? 0) + oy)
    const w = r(n.width ?? 1)
    const h = r(n.height ?? 1)
    if (n.id.startsWith('g')) {
      // Border-only frame: no occupied fill and no occupied border, so ELK's
      // routes may run through the frame and cross its border — the crossing
      // resolves to `┼` through the direction bits.
      const gi = Number(n.id.slice(1))
      canvas.set(x, y, '┌', 'border')
      canvas.set(x + w - 1, y, '┐', 'border')
      canvas.set(x, y + h - 1, '└', 'border')
      canvas.set(x + w - 1, y + h - 1, '┘', 'border')
      for (let cx = x + 1; cx < x + w - 1; cx++) {
        canvas.addBits(cx, y, L | R, 'border')
        canvas.addBits(cx, y + h - 1, L | R, 'border')
      }
      for (let cy = y + 1; cy < y + h - 1; cy++) {
        canvas.addBits(x, cy, U | D, 'border')
        canvas.addBits(x + w - 1, cy, U | D, 'border')
      }
      const title = graph.groups[gi].label
      if (title !== '') {
        drawTextOverEdges(canvas, ` ${fitLabel(title, sat(w, 4))} `, x + 1, y, 'text')
      }
      for (const c of n.children ?? []) drawNode(c, x, y)
    } else {
      const ni = Number(n.id.slice(1))
      canvas.curTag = graph.nodes[ni].classes?.join(' ')
      canvas.curHref = graph.nodes[ni].href
      drawBox(
        canvas,
        { x, y, w, h, cx: x + half(w), cy: y + half(h), rank: 0 },
        wrapped[ni],
        graph.nodes[ni].shape,
      )
      canvas.curTag = undefined
      canvas.curHref = undefined
    }
  }
  for (const c of laid.children ?? []) drawNode(c, 0, 0)

  // --- edges: orthogonal sections snapped to the grid ---------------------
  // An edge's coordinates are relative to its `container` node's origin.
  const origins = new Map<string, { x: number; y: number }>()
  const collectOrigins = (n: ElkNode, ox: number, oy: number): void => {
    const x = (n.x ?? 0) + ox
    const y = (n.y ?? 0) + oy
    origins.set(n.id, { x, y })
    for (const c of n.children ?? []) collectOrigins(c, x, y)
  }
  origins.set('root', { x: 0, y: 0 })
  for (const c of laid.children ?? []) collectOrigins(c, 0, 0)

  const drawEdge = (e: ElkExtendedEdge, edge: Edge): void => {
    const base = origins.get((e as { container?: string }).container ?? 'root') ?? { x: 0, y: 0 }
    canvas.curStyle =
      edge.line === 'dotted' ? STY_DOT : edge.line === 'thick' ? STY_THICK : STY_SOLID
    // A hierarchical edge carries one section per crossed level; the chain
    // is one polyline, heads only at its true ends.
    const chain: { x: number; y: number }[] = []
    for (const sec of e.sections ?? []) {
      for (const p of [sec.startPoint, ...(sec.bendPoints ?? []), sec.endPoint]) {
        const q = { x: r(p.x + base.x), y: r(p.y + base.y) }
        const last = chain[chain.length - 1]
        if (last === undefined || last.x !== q.x || last.y !== q.y) chain.push(q)
      }
    }
    for (let i = 0; i + 1 < chain.length; i++) {
      const a = chain[i]
      const b = chain[i + 1]
      // Snap tiny rounding skew onto the dominant axis.
      if (Math.abs(a.x - b.x) >= Math.abs(a.y - b.y)) canvas.segH(a.y, a.x, b.x)
      else canvas.segV(a.x, a.y, b.y)
    }
    // Heads point along the last (first) segment's direction, drawn one
    // cell short of the endpoint — ELK ends its routes on the node border.
    const head = (
      p: { x: number; y: number },
      q: { x: number; y: number },
      glyph: (a: string) => string,
    ): void => {
      const dx = q.x - p.x
      const dy = q.y - p.y
      const arrow = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? '▶' : '◄') : dy >= 0 ? '▼' : '▲'
      canvas.set(q.x - Math.sign(dx), q.y - Math.sign(dy), glyph(arrow), 'edge')
    }
    if (chain.length >= 2) {
      if (edge.headTo !== 'none') {
        head(chain[chain.length - 2], chain[chain.length - 1], (a) => headGlyph(edge.headTo, a))
      }
      if (edge.headFrom !== 'none') head(chain[1], chain[0], (a) => headGlyph(edge.headFrom, a))
    }
    for (const l of e.labels ?? []) {
      if (l.text !== undefined && l.x !== undefined && l.y !== undefined) {
        drawTextOverEdges(canvas, l.text, r(l.x + base.x), r(l.y + base.y), 'edgeLabel')
      }
    }
  }
  laid.edges?.forEach((e, i) => {
    drawEdge(e, graph.edges[i])
  })

  canvas.finalizeMask()
  const art = canvas.toLines()
  return { ...art, classDefs: graph.classDefs, warnings: graph.warnings }
}
