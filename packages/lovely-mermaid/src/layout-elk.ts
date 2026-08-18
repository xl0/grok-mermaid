/**
 * PROTOTYPE: graph layout via elkjs instead of the rule-based router, for
 * every diagram kind that lowers to the shared `Graph`: flowchart, state,
 * class and ER. (Cardinalities join the edge label mid-edge here instead of
 * sitting at their own ends.)
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
import { parseClass } from './diagrams/class.ts'
import { parseEr } from './diagrams/er.ts'
import { parseGraph } from './diagrams/flowchart.ts'
import { parseState } from './diagrams/state.ts'
import type { Edge } from './graph.ts'
import { fitLabel, MAX_LABEL, MAX_LINES, stripControls, WRAP_WIDTH, wrapLabel } from './labels.ts'
import {
  drawBox,
  drawClassBox,
  freeRun,
  half,
  headGlyph,
  MAX_CANVAS_CELLS,
  placeLabel,
  sat,
} from './layout.ts'
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
  // 'elk.layered.feedbackEdges': 'true',
  // Depth-first reverses far fewer edges than the greedy default here, so
  // clusters land in causal order and the wrap-around bundles mostly
  // disappear, at some width cost. Model-order strategies also work now
  // (root-only — see groupOpts) but measured wider on the arch corpus.
  'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
  'elk.padding': '[top=2,left=2,bottom=2,right=2]',
}

const DIR: Record<string, string> = { down: 'DOWN', up: 'UP', right: 'RIGHT', left: 'LEFT' }

export async function renderElk(
  src: string,
  extraOpts?: Record<string, string>,
): Promise<MermaidArt | null> {
  const opts = { ...OPTS, ...extraOpts }
  src = stripControls(src)
  const graph = parseGraph(src) ?? parseState(src) ?? parseClass(src) ?? parseEr(src)
  if (graph === null) return null

  // Node ids in the ELK graph: `n<i>` for nodes, `g<i>` for groups. A node
  // whose id matches a group id proxies that group.
  const proxy = new Map<number, number>()
  graph.groups.forEach((g, gi) => {
    const ni = graph.index.get(g.id)
    if (ni !== undefined) proxy.set(ni, gi)
  })

  const wrapped = graph.nodes.map((n) => wrapLabel(n.label, WRAP_WIDTH, MAX_LINES))
  // Node widths are rounded up to EVEN: placement aligns node centres, so a
  // width-parity mismatch between aligned nodes lands centres on x.5, and
  // those halves round inconsistently between an edge's stub and its node —
  // the source of most one-cell snapping artifacts. Even widths keep every
  // centre integral. (Heights need no such care: along the flow axis layer
  // positions accumulate from integer heights and spacings, no centring.)
  const even = (v: number): number => v + (v % 2)
  const leafNode = (i: number): ElkNode => {
    const sections = graph.nodes[i].sections
    if (sections !== undefined) {
      // Class/ER compartment box: widest line anywhere, one row per line
      // plus a rule between non-empty compartments.
      const w = even(Math.max(1, ...sections.flat().map(stringWidth)) + 4)
      const filled = sections.filter((s) => s.length > 0).length
      const h = sections.reduce((s, sec) => s + sec.length, 0) + sat(filled, 1) + 2
      return { id: `n${i}`, width: w, height: h }
    }
    const lines = wrapped[i]
    const w = even(Math.max(1, ...lines.map(stringWidth)) + 4)
    return { id: `n${i}`, width: w, height: lines.length + 2 }
  }

  // Group tree: each group's ELK node carries its children; its title is an
  // ELK label so the padding accounts for it. Groups repeat the options
  // (spacing does not cascade into compounds, and even the cycle-breaking
  // copy measurably changes the result) — except a model-order strategy:
  // elkjs ≥ 0.11 crashes when one sits on a compound containing a cycle
  // (regression, 0.10 was fine). Root-only works and is what the strategy
  // means under INCLUDE_CHILDREN anyway.
  const groupOpts = { ...opts }
  if (groupOpts['elk.layered.cycleBreaking.strategy']?.includes('MODEL_ORDER')) {
    delete groupOpts['elk.layered.cycleBreaking.strategy']
  }
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
    layoutOptions: { ...groupOpts, 'elk.nodeLabels.placement': '[H_LEFT, V_TOP, OUTSIDE]' },
    children: [...nodesOf[gi].map(leafNode), ...groupChildren[gi].map(buildGroup)],
  })

  const elkId = (ni: number): string => {
    const gi = proxy.get(ni)
    return gi === undefined ? `n${ni}` : `g${gi}`
  }
  // Model-order strategies were stripped from compounds above, which would
  // hand inner cycles to the order-blind default breaker. Instead, when a
  // model-order strategy is chosen, break cycles ourselves — DFS in
  // declaration order, back edges reversed — so ELK receives a DAG (which
  // also cannot trip the elkjs crash) and declared order decides which side
  // of a cycle sits on top. Reversed routes flip back at draw time.
  const reversed = new Set<number>()
  if (opts['elk.layered.cycleBreaking.strategy']?.includes('MODEL_ORDER')) {
    const adj: number[][] = graph.nodes.map(() => [])
    graph.edges.forEach((e, i) => {
      if (e.from !== e.to) adj[e.from].push(i)
    })
    // 0 unvisited, 1 on the current path, 2 finished.
    const mark = new Uint8Array(graph.nodes.length)
    const visit = (n: number): void => {
      mark[n] = 1
      for (const ei of adj[n]) {
        const m = graph.edges[ei].to
        if (mark[m] === 1) reversed.add(ei)
        else if (mark[m] === 0) visit(m)
      }
      mark[n] = 2
    }
    mark.forEach((v, n) => {
      if (v === 0) visit(n)
    })
  }

  // ELK never sees the labels: reserving corridor space beside long
  // vertical runs is what spread the diagram. Labels are placed after
  // routing, set into a horizontal run of their own edge.
  const edges: ElkExtendedEdge[] = graph.edges.map((e, i) => ({
    id: `e${i}`,
    sources: [elkId(reversed.has(i) ? e.to : e.from)],
    targets: [elkId(reversed.has(i) ? e.from : e.to)],
  }))

  const root: ElkNode = {
    id: 'root',
    layoutOptions: {
      ...opts,
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
      // The whole rect, border included, carries the nesting depth;
      // renderers tint per depth the way mermaid shades clusters. Nested
      // frames stack via ++.
      for (let cy = y; cy < y + h; cy++) {
        for (let cx = x; cx < x + w; cx++) {
          canvas.frame[canvas.idx(cx, cy)]++
        }
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
      const sections = graph.nodes[ni].sections
      if (sections !== undefined) {
        drawClassBox(canvas, { x, y, w, h, cx: x + half(w), cy: y + half(h), rank: 0 }, sections)
        canvas.curTag = undefined
        canvas.curHref = undefined
        return
      }
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

  const drawEdge = (e: ElkExtendedEdge, edge: Edge, flip: boolean): { x: number; y: number }[] => {
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
    // A pre-reversed edge (our model-order cycle breaking) routed backward;
    // flip the chain so heads land at the declared ends.
    if (flip) chain.reverse()
    // Heads point along the last (first) segment's direction, in the cell
    // adjacent to the node border. ELK ends routes on the node's geometric
    // edge, which is half-open: a top/left coordinate IS the border cell
    // (head one short of it), a bottom/right coordinate is one past it
    // (the endpoint cell itself is the adjacent one).
    const head = (
      p: { x: number; y: number },
      q: { x: number; y: number },
      glyph: (a: string) => string,
    ): void => {
      const dx = q.x - p.x
      const dy = q.y - p.y
      const arrow = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? '▶' : '◄') : dy >= 0 ? '▼' : '▲'
      canvas.set(q.x - (dx > 0 ? 1 : 0), q.y - (dy > 0 ? 1 : 0), glyph(arrow), 'edge')
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
    chains[i] = drawEdge(e, graph.edges[i], reversed.has(i))
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
  // On a vertical run the label straddles the line — centred on it, the
  // stroke interrupted like a lane label — sliding along the run from its
  // middle to find a row with lateral room. The run's own column is
  // welcome inside the window; any other vertical blocks it.
  const placeAcrossV = (t: string, x: number, yA: number, yB: number, relaxed = false): boolean => {
    const lo = Math.min(yA, yB) + 1
    const hi = Math.max(yA, yB) - 1
    if (lo > hi) return false
    const tw = stringWidth(t)
    const roomAt = (row: number): number | null => {
      const extent = (dir: 1 | -1): number => {
        let n = 0
        while (n < tw) {
          const cx = x + dir * (1 + n)
          if (cx < 0 || cx >= canvas.w) break
          const ci = canvas.idx(cx, row)
          if (canvas.occupied[ci] || canvas.ch[ci] !== ' ') break
          // Strict: crossing another vertical is blocked. Relaxed (the
          // retry once every run failed strict): the label may straddle
          // other edges — drawTextOverEdges interrupts the stroke
          // cleanly — but never a frame border.
          if ((canvas.mask[ci] & (U | D)) !== 0 && (!relaxed || canvas.role[ci] === 'border')) break
          n++
        }
        return n
      }
      const left = extent(-1)
      const right = extent(1)
      if (left + 1 + right < tw) return null
      return Math.max(x - left, Math.min(x - half(tw), x + 1 + right - tw))
    }
    const mid = half(lo + hi)
    for (let d = 0; mid - d >= lo || mid + d <= hi; d++) {
      for (const row of d === 0 ? [mid] : [mid - d, mid + d]) {
        if (row < lo || row > hi) continue
        const at = roomAt(row)
        if (at !== null) {
          drawTextOverEdges(canvas, t, at, row, 'edgeLabel')
          return true
        }
      }
    }
    return false
  }

  graph.edges.forEach((edge, i) => {
    const text = [edge.cardFrom ?? '', edge.label ?? '', edge.cardTo ?? '']
      .filter(Boolean)
      .join(' ')
    const chain = chains[i]
    if (text === '' || chain === undefined || chain.length < 2) return
    const t = ` ${fitLabel(text, MAX_LABEL)} `
    const hRuns: { y: number; lo: number; hi: number; len: number }[] = []
    const vRuns: { x: number; yA: number; yB: number; len: number }[] = []
    for (let j = 0; j + 1 < chain.length; j++) {
      const a = chain[j]
      const b = chain[j + 1]
      if (a.y === b.y) {
        const lo = Math.min(a.x, b.x)
        const hi = Math.max(a.x, b.x)
        hRuns.push({ y: a.y, lo, hi, len: hi - lo })
      } else {
        vRuns.push({ x: a.x, yA: a.y, yB: b.y, len: Math.abs(b.y - a.y) })
      }
    }
    hRuns.sort((a, b) => b.len - a.len)
    for (const run of hRuns) {
      if (placeOnRun(t, run.y, run.lo, run.hi)) return
    }
    vRuns.sort((a, b) => b.len - a.len)
    for (const run of vRuns) {
      if (placeAcrossV(t, run.x, run.yA, run.yB)) return
    }
    for (const run of vRuns) {
      if (placeAcrossV(t, run.x, run.yA, run.yB, true)) return
    }
    if (vRuns.length > 0) {
      // Last resort: beside the longest vertical, ellipsised to the roomier
      // side's free stretch — a silently clipped label lies.
      const { x } = vRuns[0]
      const midY = half(vRuns[0].yA + vRuns[0].yB)
      const right = freeRun(canvas, midY, x + 2, 1)
      const left = freeRun(canvas, midY, x - 2, -1)
      if (right >= left) {
        placeLabel(canvas, fitLabel(text, Math.max(right, 2)), midY, x + 2)
      } else {
        const cut = fitLabel(text, left)
        placeLabel(canvas, cut, midY, x - 1 - stringWidth(cut))
      }
    }
  })

  canvas.finalizeMask()
  const art = canvas.toLines()
  return { ...art, classDefs: graph.classDefs, warnings: graph.warnings }
}
