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

// The bundled build: elkjs's node entry requires the `web-worker` package,
// which browser bundlers cannot resolve; the bundle inlines its glue.
import type { ElkExtendedEdge, ElkNode } from 'elkjs'
import ELK from 'elkjs/lib/elk.bundled.js'
import { Canvas, D, drawTextOverEdges, L, R, STY_DOT, STY_SOLID, STY_THICK, U } from './canvas.ts'
import { parseGraph } from './diagrams/flowchart.ts'
import type { Edge } from './graph.ts'
import { fitLabel, MAX_LABEL, MAX_LINES, stripControls, WRAP_WIDTH, wrapLabel } from './labels.ts'
import { drawBox, half, headGlyph, MAX_CANVAS_CELLS, placeLabel, sat } from './layout.ts'
import type { MermaidArt } from './types.ts'
import { stringWidth } from './width.ts'

// elkjs's own worker glue works in node and in browser bundles, but not
// under bun's CJS interop — hand bun the runtime's Worker explicitly.
const elk = new ELK(
  (globalThis as { Bun?: unknown }).Bun === undefined
    ? {}
    : { workerFactory: () => new Worker(import.meta.resolve('elkjs/lib/elk-worker.min.js')) },
)

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
  // Reversed (cycle-breaking) edges route as feedback beside the flow
  // instead of wrapping the whole diagram to re-enter from the top.
  'elk.layered.feedbackEdges': 'true',
  'elk.padding': '[top=2,left=2,bottom=2,right=2]',
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
  // ELK never sees the labels: reserving corridor space beside long
  // vertical runs is what spread the diagram. Labels are placed after
  // routing, set into a horizontal run of their own edge.
  const edges: ElkExtendedEdge[] = graph.edges.map((e, i) => ({
    id: `e${i}`,
    sources: [elkId(e.from)],
    targets: [elkId(e.to)],
  }))

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
      // resolves through the direction bits. Thick line so cluster bounds
      // stand apart from node borders and edges.
      const gi = Number(n.id.slice(1))
      canvas.set(x, y, '┏', 'border')
      canvas.set(x + w - 1, y, '┓', 'border')
      canvas.set(x, y + h - 1, '┗', 'border')
      canvas.set(x + w - 1, y + h - 1, '┛', 'border')
      canvas.curStyle = STY_THICK
      for (let cx = x + 1; cx < x + w - 1; cx++) {
        canvas.addBits(cx, y, L | R, 'border')
        canvas.addBits(cx, y + h - 1, L | R, 'border')
      }
      for (let cy = y + 1; cy < y + h - 1; cy++) {
        canvas.addBits(x, cy, U | D, 'border')
        canvas.addBits(x + w - 1, cy, U | D, 'border')
      }
      canvas.curStyle = STY_SOLID
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

  const drawEdge = (e: ElkExtendedEdge, edge: Edge): { x: number; y: number }[] => {
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
    // Snap to strict horizontal/vertical runs: rounding leaves one-cell
    // jogs that would draw as dangling stubs at corners. Each point takes
    // the previous point's minor-axis coordinate, then collapsed runs drop.
    for (let i = 1; i < chain.length; i++) {
      const a = chain[i - 1]
      const b = chain[i]
      if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) b.y = a.y
      else b.x = a.x
    }
    for (let i = chain.length - 1; i > 0; i--) {
      if (chain[i].x === chain[i - 1].x && chain[i].y === chain[i - 1].y) chain.splice(i, 1)
    }
    for (let i = 0; i + 1 < chain.length; i++) {
      const a = chain[i]
      const b = chain[i + 1]
      if (a.y === b.y) canvas.segH(a.y, a.x, b.x)
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
    return chain
  }
  const chains: { x: number; y: number }[][] = []
  laid.edges?.forEach((e, i) => {
    chains[i] = drawEdge(e, graph.edges[i])
  })

  // Labels go onto a horizontal run of their own edge, once every edge has
  // landed: centred on the longest run, slid to a stretch free of crossing
  // verticals and other labels, set into the line (`── label ──`). Falls
  // back to shorter runs, then to sitting beside the longest vertical run.
  const placeOnRun = (text: string, y: number, lo: number, hi: number): boolean => {
    const tw = stringWidth(text)
    const lastStart = hi - 1 - tw
    if (lastStart < lo + 1 || y < 0 || y >= canvas.h) return false
    const clear = (start: number): boolean => {
      for (let x = start; x < start + tw; x++) {
        const ci = canvas.idx(x, y)
        if (canvas.occupied[ci] === 1) return false
        if ((canvas.mask[ci] & (U | D)) !== 0) return false
        if (canvas.ch[ci] !== ' ') return false
      }
      return true
    }
    const mid = Math.min(Math.max(half(lo + hi) - half(tw), lo + 1), lastStart)
    for (let d = 0; ; d++) {
      const l = mid - d
      const rr = mid + d
      if (l < lo + 1 && rr > lastStart) return false
      if (l >= lo + 1 && clear(l)) {
        drawTextOverEdges(canvas, text, l, y, 'edgeLabel')
        return true
      }
      if (rr <= lastStart && clear(rr)) {
        drawTextOverEdges(canvas, text, rr, y, 'edgeLabel')
        return true
      }
    }
  }
  graph.edges.forEach((edge, i) => {
    const text = [edge.cardFrom ?? '', edge.label ?? '', edge.cardTo ?? '']
      .filter(Boolean)
      .join(' ')
    const chain = chains[i]
    if (text === '' || chain === undefined || chain.length < 2) return
    const t = ` ${fitLabel(text, MAX_LABEL)} `
    const hRuns: { y: number; lo: number; hi: number; len: number }[] = []
    let longestV: { x: number; midY: number; len: number } | null = null
    for (let j = 0; j + 1 < chain.length; j++) {
      const a = chain[j]
      const b = chain[j + 1]
      if (a.y === b.y) {
        const lo = Math.min(a.x, b.x)
        const hi = Math.max(a.x, b.x)
        hRuns.push({ y: a.y, lo, hi, len: hi - lo })
      } else {
        const len = Math.abs(b.y - a.y)
        if (longestV === null || len > longestV.len) {
          longestV = { x: a.x, midY: half(a.y + b.y), len }
        }
      }
    }
    hRuns.sort((a, b) => b.len - a.len)
    for (const run of hRuns) {
      if (placeOnRun(t, run.y, run.lo, run.hi)) return
    }
    if (longestV !== null) placeLabel(canvas, text, longestV.midY, longestV.x + 2)
  })

  canvas.finalizeMask()
  const art = canvas.toLines()
  return { ...art, classDefs: graph.classDefs, warnings: graph.warnings }
}
