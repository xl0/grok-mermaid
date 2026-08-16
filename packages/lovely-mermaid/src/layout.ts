/**
 * Graph layout: rank, order, place, route, draw.
 *
 * Follows the Sugiyama outline — assign ranks along the flow axis, reorder
 * within ranks to cut crossings, then relax positions on the cross axis so
 * chains stay straight. Edges between adjacent ranks share horizontal "bus"
 * rows; everything else is routed around the diagram through vertical "lanes".
 *
 * `BT` and `RL` reuse the `TD`/`LR` layouts and flip the finished canvas, so
 * text never ends up mirrored.
 */

import {
  Canvas,
  CONT,
  D,
  drawText,
  drawTextOverEdges,
  L,
  R,
  STY_DOT,
  STY_SOLID,
  STY_THICK,
  U,
} from './canvas.ts'
import type { Dir, Edge, Head, Node, Shape } from './graph.ts'
import { Graph } from './graph.ts'
import { fitLabel, MAX_LABEL, MAX_LINES, WRAP_WIDTH, wrapLabel } from './labels.ts'
import { measured, stringWidth } from './width.ts'

/** Cells of padding between a box border and its text. */
export const PAD = 1
/** Minimum horizontal / vertical space between boxes. */
const GAP_X = 3
const GAP_Y = 2
/** Refuse to allocate a canvas larger than this many cells. */
export const MAX_CANVAS_CELLS = 1 << 21

/** A laid-out canvas, or `null` when the diagram is empty or over the cell cap. */
export type CanvasResult = Canvas | null

/** Saturating subtraction; Rust's `usize` arithmetic never goes negative. */
export const sat = (a: number, b: number): number => Math.max(0, a - b)
export const half = (n: number): number => Math.floor(n / 2)

/**
 * Everything an edge says, joined — the fallback for routes that have no
 * per-end placement (lanes, self-loops). Forward routes place `cardFrom` /
 * `cardTo` at their own ends instead.
 */
function edgeText(edge: Edge): string | null {
  const joined = [edge.cardFrom ?? '', edge.label ?? '', edge.cardTo ?? '']
    .filter((part) => part !== '')
    .join(' ')
  return joined === '' ? null : joined
}

export interface Placed {
  x: number
  y: number
  w: number
  h: number
  cx: number
  cy: number
  rank: number
}

/** Per-node dimensions. `lay*` include room for self-edge loops and labels. */
interface NodeSizes {
  boxW: number[]
  boxH: number[]
  layW: number[]
  layH: number[]
  extraH: number[]
  selfLabelW: number[]
}

/** What to draw inside a node box. */
export type NodeExtra =
  | { kind: 'plain' }
  | { kind: 'frame'; sub: Canvas }
  | { kind: 'compartments'; sections: string[][] }

interface RoutePlan {
  canvasW: number
  canvasH: number
  /** Coordinate just past each rank's boxes, where its bus rows begin. */
  bandEnd: number[]
  /** Coordinate where each rank's boxes begin — no box sits before it. */
  rankStart: number[]
  /** Bus track offset per edge. */
  edgeBus: number[]
  /** Absolute lane coordinate per laned edge (x in TD, y in LR). */
  edgeLaneX: number[]
  /** Reserved corridor row above rank r for laned skip approaches, or -1. */
  skipApproach: number[]
  /** Skip edges: the column entering the target's top, or -1. */
  edgeEntryX: number[]
  /** Skip edges: entry column is box-free, drop straight and skip the lane. */
  edgeStraight: boolean[]
  /** Per node: the forward cluster's entry column, or -1 for the centre. */
  fwdEntryX: number[]
  /** Per edge: render the label left of the arrowhead instead of right. */
  edgeLabelLeft: boolean[]
}

// ------------------------------------------------------------------ ranking

/**
 * Longest-path ranking over the graph's DAG.
 *
 * Back edges (those closing a cycle) are excluded by a DFS colouring pass, so
 * `A --> B --> C --> A` still ranks 0, 1, 2 rather than diverging.
 */
export function computeRanks(graph: Graph): number[] {
  const n = graph.nodes.length
  const children: number[][] = Array.from({ length: n }, () => [])
  const indeg = new Array<number>(n).fill(0)
  for (const e of graph.edges) {
    if (e.from !== e.to) {
      children[e.from].push(e.to)
      indeg[e.to]++
    }
  }

  const color = new Uint8Array(n)
  const dag: number[][] = Array.from({ length: n }, () => [])
  const order: number[] = []

  // Roots first so ranks grow from natural entry points, then any leftovers.
  const roots = [...Array(n).keys()].filter((i) => indeg[i] === 0)
  for (const start of [...roots, ...Array(n).keys()]) {
    if (color[start] === 0) dfsDag(start, children, color, dag, order)
  }

  const rank = new Array<number>(n).fill(0)
  for (let i = order.length - 1; i >= 0; i--) {
    const u = order[i]
    for (const v of dag[u]) rank[v] = Math.max(rank[v], rank[u] + 1)
  }
  return rank
}

/** Iterative DFS recording postorder and skipping edges back into the stack. */
function dfsDag(
  start: number,
  children: number[][],
  color: Uint8Array,
  dag: number[][],
  order: number[],
): void {
  const stack: { u: number; i: number }[] = [{ u: start, i: 0 }]
  color[start] = 1
  while (stack.length > 0) {
    const frame = stack[stack.length - 1]
    const u = frame.u
    if (frame.i < children[u].length) {
      const v = children[u][frame.i]
      frame.i++
      if (color[v] === 1) continue // grey: a back edge, ignore it
      dag[u].push(v)
      if (color[v] === 0) {
        color[v] = 1
        stack.push({ u: v, i: 0 })
      }
    } else {
      color[u] = 2
      order.push(u)
      stack.pop()
    }
  }
}

/**
 * Reorder nodes within each rank to minimise edge crossings (barycenter
 * sweeps): alternate down/up passes sort each rank by the mean position of its
 * neighbours, keeping whichever ordering crossed least.
 */
export function orderRanks(byRank: number[][], edges: Edge[], ranks: number[]): void {
  const n = ranks.length
  if (byRank.length < 2 || n < 3) return

  const parents: number[][] = Array.from({ length: n }, () => [])
  const children: number[][] = Array.from({ length: n }, () => [])
  for (const e of edges) {
    if (e.from !== e.to && ranks[e.to] > ranks[e.from]) {
      parents[e.to].push(e.from)
      children[e.from].push(e.to)
    }
  }

  const pos = new Array<number>(n).fill(0)
  const reindex = (row: number[]): void => {
    for (let i = 0; i < row.length; i++) pos[row[i]] = i
  }
  for (const row of byRank) reindex(row)

  let best = byRank.map((row) => [...row])
  let bestCrossings = countCrossings(edges, ranks, pos)
  if (bestCrossings === 0) return

  for (let it = 0; it < 8; it++) {
    // Alternate sweeping down (sort by parents) and up (sort by children).
    const rows = it % 2 === 0 ? byRank.slice(1) : byRank.slice(0, -1).reverse()
    const neigh = it % 2 === 0 ? parents : children
    for (const row of rows) {
      sortByBarycenter(row, neigh, pos)
      reindex(row)
    }
    const crossings = countCrossings(edges, ranks, pos)
    if (crossings < bestCrossings) {
      bestCrossings = crossings
      best = byRank.map((row) => [...row])
    }
    if (bestCrossings === 0) break
  }

  for (let i = 0; i < byRank.length; i++) byRank[i].splice(0, byRank[i].length, ...best[i])
}

function sortByBarycenter(row: number[], neigh: number[][], pos: number[]): void {
  const keyed = row.map((v) => ({
    key:
      neigh[v].length === 0 ? pos[v] : neigh[v].reduce((s, u) => s + pos[u], 0) / neigh[v].length,
    v,
  }))
  keyed.sort((a, b) => a.key - b.key)
  for (let i = 0; i < keyed.length; i++) row[i] = keyed[i].v
}

export function countCrossings(edges: Edge[], ranks: number[], pos: number[]): number {
  const adjacent = edges
    .filter((e) => e.from !== e.to && ranks[e.to] === ranks[e.from] + 1)
    .map((e) => [ranks[e.from], pos[e.from], pos[e.to]] as const)
  let crossings = 0
  for (let i = 0; i < adjacent.length; i++) {
    const a = adjacent[i]
    for (let j = i + 1; j < adjacent.length; j++) {
      const b = adjacent[j]
      if (a[0] === b[0] && ((a[1] < b[1] && a[2] > b[2]) || (a[1] > b[1] && a[2] < b[2]))) {
        crossings++
      }
    }
  }
  return crossings
}

/**
 * Assign a cross-axis centre to every node so nodes line up under their
 * neighbours: each node drifts toward the average of its neighbours while
 * ranks keep their order and boxes keep `sep` between them.
 */
export function assignPositions(
  byRank: number[][],
  size: number[],
  sep: number,
  edges: Edge[],
  ranks: number[],
): number[] {
  const n = size.length
  const parents: number[][] = Array.from({ length: n }, () => [])
  const children: number[][] = Array.from({ length: n }, () => [])
  for (const e of edges) {
    if (e.from !== e.to && ranks[e.to] > ranks[e.from]) {
      parents[e.to].push(e.from)
      children[e.from].push(e.to)
    }
  }

  const pos = new Array<number>(n).fill(0)
  for (const row of byRank) {
    let x = 0
    for (const v of row) {
      const h = size[v] / 2
      x += h
      pos[v] = x
      x += h + sep
    }
  }

  for (let it = 0; it < 10; it++) {
    const rows = it % 2 === 0 ? byRank : [...byRank].reverse()
    const neigh = it % 2 === 0 ? parents : children
    for (const row of rows) relaxRank(row, neigh, pos, size, sep)
  }

  let minLeft = Number.POSITIVE_INFINITY
  for (let v = 0; v < n; v++) minLeft = Math.min(minLeft, pos[v] - size[v] / 2)
  if (!Number.isFinite(minLeft)) minLeft = 0
  return Array.from({ length: n }, (_, v) => Math.max(0, Math.round(pos[v] - minLeft)))
}

function relaxRank(
  nodes: number[],
  neigh: number[][],
  pos: number[],
  size: number[],
  sep: number,
): void {
  const n = nodes.length
  if (n === 0) return

  const desired = nodes.map((v) =>
    neigh[v].length === 0 ? pos[v] : neigh[v].reduce((s, u) => s + pos[u], 0) / neigh[v].length,
  )
  const halfOf = (i: number): number => size[nodes[i]] / 2

  // Sweep right then left, then take the midpoint: this centres a node between
  // the tightest packing that respects order from either side.
  const left = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    left[i] =
      i === 0 ? desired[i] : Math.max(desired[i], left[i - 1] + halfOf(i - 1) + sep + halfOf(i))
  }
  const right = new Array<number>(n)
  for (let i = n - 1; i >= 0; i--) {
    right[i] =
      i === n - 1
        ? desired[i]
        : Math.min(desired[i], right[i + 1] - halfOf(i + 1) - sep - halfOf(i))
  }
  for (let i = 0; i < n; i++) pos[nodes[i]] = (left[i] + right[i]) / 2
  for (let i = 1; i < n; i++) {
    const minP = pos[nodes[i - 1]] + halfOf(i - 1) + sep + halfOf(i)
    if (pos[nodes[i]] < minP) pos[nodes[i]] = minP
  }
}

// ------------------------------------------------------------------- tracks

/** A span competing for a track: the covered coordinate range plus its edge. */
interface TrackSpan {
  start: number
  end: number
  from: number
  to: number
  edge: number
  /** A labelled lane refuses endpoint sharing: the label would appear to
   * cover every edge merged onto the row. Bus spans never set this — their
   * labels sit at the separate arrival ends, so fan merging stays safe. */
  labeled?: boolean
}

/**
 * Pack spans into as few parallel tracks as possible.
 *
 * Two spans share a track when they are two cells apart, or when they share an
 * endpoint — edges fanning out of one node deliberately reuse a single row so
 * a merge draws one arrowhead rather than a stack of them.
 */
export function assignTracks(
  spans: TrackSpan[],
  shortestFirst = false,
): { assigned: [number, number][]; count: number } {
  // Lanes pack shortest-first: a span contained in another takes the inner
  // track, so exits and entries at rows the inner lane never reaches cross
  // nothing. Buses keep the start-ordered packing.
  const sorted = [...spans].sort(
    (a, b) =>
      (shortestFirst ? a.end - a.start - (b.end - b.start) : 0) ||
      a.start - b.start ||
      a.end - b.end ||
      a.from - b.from ||
      a.to - b.to ||
      a.edge - b.edge,
  )
  const tracks: TrackSpan[][] = []
  const assigned: [number, number][] = []
  for (const span of sorted) {
    let slot = tracks.findIndex((members) =>
      members.every(
        (m) =>
          m.end + 2 <= span.start ||
          span.end + 2 <= m.start ||
          ((m.from === span.from || m.to === span.to) && !m.labeled && !span.labeled),
      ),
    )
    if (slot === -1) {
      tracks.push([])
      slot = tracks.length - 1
    }
    tracks[slot].push(span)
    assigned.push([span.edge, slot])
  }
  return { assigned, count: tracks.length }
}

/**
 * An edge between adjacent ranks running against the direction. In top-down
 * layouts these route locally through the same band as their forward
 * siblings — the short return arrow mermaid draws — rather than around the
 * diagram. Left-to-right boxes are three rows tall, leaving no room to
 * offset the return off the centre row, so LR/RL keep the lane.
 */
export const isAdjacentBack = (ranks: number[], e: Edge): boolean =>
  e.from !== e.to && ranks[e.from] === ranks[e.to] + 1

/** Edges crossing the band between rank `r` and `r + 1` that must jog
 * sideways, so need a bus row. `withBack` admits adjacent back edges. */
function busSpans(
  graph: Graph,
  ranks: number[],
  centers: number[],
  r: number,
  exact: boolean,
  withBack: boolean,
): TrackSpan[] {
  const out: TrackSpan[] = []
  graph.edges.forEach((e, i) => {
    const jogs = exact
      ? centers[e.from] !== centers[e.to]
      : Math.abs(centers[e.from] - centers[e.to]) > 1
    const lo = Math.min(ranks[e.from], ranks[e.to])
    const adjacent = withBack
      ? Math.abs(ranks[e.from] - ranks[e.to]) === 1
      : ranks[e.to] === ranks[e.from] + 1
    if (e.from !== e.to && adjacent && lo === r && jogs) {
      out.push({
        start: Math.min(centers[e.from], centers[e.to]),
        end: Math.max(centers[e.from], centers[e.to]),
        from: e.from,
        to: e.to,
        edge: i,
      })
    }
  })
  return out
}

/** Edges skipping a rank or running backwards; these go around in a lane. */
function laneSpans(
  graph: Graph,
  ranks: number[],
  placed: Placed[],
  vertical: boolean,
): TrackSpan[] {
  const out: TrackSpan[] = []
  graph.edges.forEach((e, i) => {
    if (e.from === e.to || ranks[e.to] === ranks[e.from] + 1) return
    if (vertical && isAdjacentBack(ranks, e)) return
    const pf = placed[e.from]
    const pt = placed[e.to]
    const a = vertical ? Math.min(pf.cy, pt.cy) : Math.min(pf.cx, pt.cx)
    const b = vertical ? Math.max(pf.cy, pt.cy) : Math.max(pf.cx, pt.cx)
    out.push({ start: a, end: b, from: e.from, to: e.to, edge: i, labeled: edgeText(e) !== null })
  })
  return out
}

// ----------------------------------------------------------------- placement

function placeTd(
  ranks: number[],
  maxRank: number,
  byRank: number[][],
  sizes: NodeSizes,
  graph: Graph,
  placed: Placed[],
  edgeSide: ('left' | 'right')[],
  edgeInner?: (EdgeInner | undefined)[],
): RoutePlan {
  const centers = assignPositions(byRank, sizes.layW, GAP_X, graph.edges, ranks)

  // Top-entry geometry, derivable before placement. A node's entries — the
  // merged forward cluster plus each skip — spread evenly across the box top
  // (two entries land at ~1/3 and ~2/3). A forward arrival aligned with its
  // source stays at centre so chains keep no kinks, and the skips spread
  // over the right half instead. A label that does not fit before the next
  // entry renders left of its arrow. A skip whose entry column crosses no
  // box on any intermediate rank drops straight instead of taking a lane.
  const boxL = (j: number): number => sat(centers[j], half(sizes.boxW[j]))
  const boxR = (j: number): number => boxL(j) + sizes.boxW[j] - 1
  const isSkip = (e: Edge): boolean => e.from !== e.to && ranks[e.to] - ranks[e.from] > 1
  const edgeEntryX = new Array<number>(graph.edges.length).fill(-1)
  const edgeStraight = new Array<boolean>(graph.edges.length).fill(false)
  const fwdEntryX = new Array<number>(graph.nodes.length).fill(-1)
  const edgeLabelLeft = new Array<boolean>(graph.edges.length).fill(false)
  const labelW = (e: Edge): number => {
    const parts = [e.label, e.cardTo].filter((p) => p != null) as string[]
    return parts.length === 0
      ? -1
      : Math.max(...parts.map((p) => Math.min(stringWidth(p), MAX_LABEL)))
  }
  const skipsInto: number[][] = graph.nodes.map(() => [])
  const fwdsInto: number[][] = graph.nodes.map(() => [])
  graph.edges.forEach((e, i) => {
    if (e.from === e.to) return
    if (isSkip(e)) skipsInto[e.to].push(i)
    else if (ranks[e.to] === ranks[e.from] + 1) fwdsInto[e.to].push(i)
  })
  graph.nodes.forEach((_, t) => {
    const skips = skipsInto[t]
    if (skips.length === 0) return
    const fwds = fwdsInto[t]
    const cx = centers[t]
    const left = boxL(t)
    const right = boxR(t)
    const hasFwd = fwds.length > 0
    const aligned = hasFwd && fwds.some((i) => Math.abs(centers[graph.edges[i].from] - cx) <= 1)
    const spreadL = hasFwd && aligned ? cx : left
    const slots = hasFwd && aligned ? skips.length : (hasFwd ? 1 : 0) + skips.length
    const slot = (i: number): number =>
      spreadL + Math.round(((right - spreadL) * (i + 1)) / (slots + 1))
    /** Ordered entries: the forward cluster (if any), then each skip. */
    const items: { slot: number; w: number; skip: number | null }[] = []
    if (hasFwd) {
      items.push({
        slot: aligned ? cx : slot(0),
        w: Math.max(...fwds.map((i) => labelW(graph.edges[i]))),
        skip: null,
      })
    }
    skips.forEach((si, j) => {
      items.push({
        slot: slot(hasFwd && aligned ? j : j + (hasFwd ? 1 : 0)),
        w: labelW(graph.edges[si]),
        skip: si,
      })
    })
    // Walk left to right with a cursor over the free head-row cells: each
    // entry lands at its slot (or past the previous label), its own label
    // going right when the next slot leaves room, else left when the cells
    // behind the cursor allow. Overflow falls back to the legacy rule.
    const cols: number[] = []
    const lefts: boolean[] = []
    let cursor = left
    let fits = true
    for (const [i, item] of items.entries()) {
      const x = Math.max(item.slot, cursor)
      if (x > right - 1) {
        fits = false
        break
      }
      const next = items[i + 1]?.slot ?? Number.MAX_SAFE_INTEGER
      const w = item.w
      if (w >= 0 && x + w + 2 > next && x - cursor >= w) {
        lefts.push(true)
        cursor = x + 2
      } else {
        lefts.push(false)
        cursor = w >= 0 ? x + w + 2 : x + 2
      }
      cols.push(x)
    }
    if (fits) {
      items.forEach((item, i) => {
        if (item.skip === null) {
          fwdEntryX[t] = cols[i]
          if (lefts[i]) for (const fi of fwds) edgeLabelLeft[fi] = true
        } else {
          edgeEntryX[item.skip] = cols[i]
          edgeLabelLeft[item.skip] = lefts[i]
        }
      })
      return
    }
    // Legacy: forward stays centred; a skip lands past the arrival labels,
    // or left of centre with its own label flipped left.
    const reach = hasFwd ? Math.max(cx, ...fwds.map((i) => cx + 1 + labelW(graph.edges[i]))) : -1
    for (const si of skips) {
      const clear = reach === -1 ? cx + 2 : reach + 2
      const capped = Math.min(clear, right - 1)
      if (capped > Math.max(cx, reach)) {
        edgeEntryX[si] = capped
      } else {
        edgeEntryX[si] = Math.max(left + 1, cx - 2)
        edgeLabelLeft[si] = true
      }
    }
  })
  graph.edges.forEach((e, i) => {
    if (!isSkip(e)) return
    const entryX = edgeEntryX[i]
    edgeStraight[i] = graph.nodes.every(
      (_, j) =>
        ranks[j] <= ranks[e.from] ||
        ranks[j] >= ranks[e.to] ||
        entryX < boxL(j) ||
        entryX > boxR(j),
    )
  })

  const edgeBus = new Array<number>(graph.edges.length).fill(0)
  const busTracks = new Array<number>(maxRank + 1).fill(0)
  for (let r = 0; r < maxRank; r++) {
    const spans = busSpans(graph, ranks, centers, r, false, true)
    // Skip departures ride the bus tracks of their own band: endpoint
    // sharing folds them onto their siblings' row, so a node's forward fan
    // and its skips split from one `┴` origin.
    graph.edges.forEach((e, i) => {
      if (!isSkip(e) || ranks[e.from] !== r) return
      const endX = edgeStraight[i] ? edgeEntryX[i] : 1 << 29
      spans.push({
        start: Math.min(centers[e.from], endX),
        end: Math.max(centers[e.from], endX),
        from: e.from,
        to: e.to,
        edge: i,
      })
    })
    // An inner-attached endpoint can move an edge's attach column anywhere
    // on its frame after placement, so reserve a track wide enough for any
    // outcome — even for an edge the plan saw as straight.
    if (edgeInner !== undefined) {
      graph.edges.forEach((e, i) => {
        if (edgeInner[i] === undefined || e.from === e.to) return
        const inBand =
          ((ranks[e.to] === ranks[e.from] + 1 || isSkip(e)) && ranks[e.from] === r) ||
          (isAdjacentBack(ranks, e) && ranks[e.to] === r)
        if (!inBand) return
        const span = {
          start: Math.min(boxL(e.from), boxL(e.to)),
          end: Math.max(boxR(e.from), boxR(e.to)),
          from: e.from,
          to: e.to,
          edge: i,
        }
        const at = spans.findIndex((s) => s.edge === i)
        if (at === -1) spans.push(span)
        else spans[at] = span
      })
    }
    if (spans.length === 0) continue
    // Back-edge arrowheads sit on the first band row, back buses right under
    // it, forward buses below those: with the attach columns offset right of
    // centre, a reciprocal pair then runs as two parallel staircases whose
    // verticals fall outside each other's horizontal spans — no crossings.
    // A departing `<-->` head also wants that spare row: its glyph sits just
    // below the box, and a bus turning there would erase the corner.
    const back = spans.filter((s) => isAdjacentBack(ranks, graph.edges[s.edge]))
    const fwd = spans.filter((s) => !isAdjacentBack(ranks, graph.edges[s.edge]))
    const base = graph.edges.some(
      (e) =>
        (isAdjacentBack(ranks, e) && ranks[e.to] === r) ||
        (e.from !== e.to && e.headFrom !== 'none' && ranks[e.from] === r && ranks[e.to] > r),
    )
      ? 1
      : 0
    const b = assignTracks(back)
    for (const [idx, slot] of b.assigned) edgeBus[idx] = base + slot
    const f = assignTracks(fwd)
    for (const [idx, slot] of f.assigned) edgeBus[idx] = base + b.count + slot
    busTracks[r] = base + b.count + f.count
  }
  // A laned skip re-enters along a reserved approach row above the target's
  // rank, over the arrival heads and their labels; straight drops need none.
  const entersInto = new Array<boolean>(maxRank + 1).fill(false)
  graph.edges.forEach((e, i) => {
    if (isSkip(e) && !edgeStraight[i]) entersInto[ranks[e.to]] = true
  })
  for (let r = 0; r < maxRank; r++) {
    if (entersInto[r + 1]) busTracks[r] += 1
  }

  const rankH = byRank.map((row) =>
    row.length === 0 ? 3 : Math.max(...row.map((i) => sizes.boxH[i] + sizes.extraH[i])),
  )
  // Per-end cardinalities want a row each around the verb: source card,
  // label, arrow-and-target-card.
  const hasCards = graph.edges.some((e) => e.cardFrom !== undefined || e.cardTo !== undefined)
  const gapY = hasCards ? Math.max(GAP_Y, 3) : GAP_Y
  const rankY = new Array<number>(maxRank + 1).fill(0)
  for (let r = 1; r <= maxRank; r++) {
    rankY[r] = rankY[r - 1] + rankH[r - 1] + Math.max(gapY, busTracks[r - 1] + 1)
  }
  const canvasH = rankY[maxRank] + rankH[maxRank]
  const bandEnd = Array.from({ length: maxRank + 1 }, (_, r) => rankY[r] + rankH[r])
  const rankStart = rankY

  // Approach rows sit just above each band's arrival-head row.
  const skipApproach = new Array<number>(maxRank + 1).fill(-1)
  for (let r = 0; r < maxRank; r++) {
    if (entersInto[r + 1]) skipApproach[r + 1] = rankY[r + 1] - 2
  }

  let diagramW = 1
  byRank.forEach((row, r) => {
    for (const idx of row) {
      const w = sizes.boxW[idx]
      const h = sizes.boxH[idx]
      const cx = centers[idx]
      const x = sat(cx, half(w))
      const y = rankY[r] + half(rankH[r] - h - sizes.extraH[idx])
      placed[idx] = { x, y, w, h, cx, cy: y + half(h), rank: r }
      diagramW = Math.max(diagramW, x + w)
      if (sizes.extraH[idx] > 0 && sizes.selfLabelW[idx] > 0) {
        diagramW = Math.max(diagramW, x + w + 2 + sizes.selfLabelW[idx])
      }
    }
  })

  // Lanes split by side. Left lanes sit before the diagram — lanes, then a
  // strip for their labels, then a gap — so everything placed shifts right.
  const lanes = laneSpans(graph, ranks, placed, true).filter((s) => !edgeStraight[s.edge])
  const lanesL = lanes.filter((s) => edgeSide[s.edge] === 'left')
  const lanesR = lanes.filter((s) => edgeSide[s.edge] === 'right')
  const edgeLaneX = new Array<number>(graph.edges.length).fill(0)
  if (lanesL.length > 0) {
    const { assigned, count } = assignTracks(lanesL, true)
    let leftPad = 0
    for (const s of lanesL) {
      const text = edgeText(graph.edges[s.edge])
      if (text !== null) leftPad = Math.max(leftPad, Math.min(stringWidth(text), MAX_LABEL))
    }
    const shift = count + leftPad + 1
    for (const p of placed) {
      p.x += shift
      p.cx += shift
    }
    for (let i = 0; i < edgeEntryX.length; i++) if (edgeEntryX[i] !== -1) edgeEntryX[i] += shift
    for (let i = 0; i < fwdEntryX.length; i++) if (fwdEntryX[i] !== -1) fwdEntryX[i] += shift
    diagramW += shift
    // Shortest lane innermost: slot 0 lands nearest the diagram.
    for (const [idx, slot] of assigned) edgeLaneX[idx] = count - 1 - slot
  }

  let contentW = diagramW
  graph.edges.forEach((e, i) => {
    if (e.from === e.to) return
    if (ranks[e.to] === ranks[e.from] + 1) {
      const parts = [e.label, e.cardTo].filter((part) => part != null) as string[]
      for (const part of parts) {
        const lw = Math.min(stringWidth(part), MAX_LABEL)
        contentW = Math.max(contentW, placed[e.to].cx + 2 + lw)
      }
      if (e.cardFrom !== undefined) {
        contentW = Math.max(contentW, placed[e.from].cx + 2 + stringWidth(e.cardFrom))
      }
    } else if (isAdjacentBack(ranks, e)) {
      const text = edgeText(e)
      if (text !== null) {
        // routeBackAdjacent starts the label at tx + 1 with tx up to cx + 2.
        contentW = Math.max(contentW, placed[e.to].cx + 3 + Math.min(stringWidth(text), MAX_LABEL))
      }
    } else if (edgeSide[i] !== 'left' || edgeStraight[i]) {
      // A left-laned label lives in the left strip already paid for above.
      const text = edgeText(e)
      if (text !== null) {
        contentW = Math.max(contentW, diagramW + Math.min(stringWidth(text), MAX_LABEL) + 1)
      }
    }
  })

  let canvasW = contentW
  if (lanesR.length > 0) {
    const { assigned, count } = assignTracks(lanesR, true)
    for (const [idx, slot] of assigned) edgeLaneX[idx] = contentW + 1 + slot
    canvasW = contentW + 1 + count
  }

  return {
    canvasW,
    canvasH,
    bandEnd,
    rankStart,
    edgeBus,
    edgeLaneX,
    skipApproach,
    edgeEntryX,
    edgeStraight,
    fwdEntryX,
    edgeLabelLeft,
  }
}

function placeLr(
  ranks: number[],
  maxRank: number,
  byRank: number[][],
  sizes: NodeSizes,
  graph: Graph,
  placed: Placed[],
  edgeInner?: (EdgeInner | undefined)[],
): RoutePlan {
  const colW = byRank.map((row) =>
    row.length === 0 ? 0 : Math.max(...row.map((i) => sizes.boxW[i])),
  )

  const centers = assignPositions(byRank, sizes.layH, 1, graph.edges, ranks)

  // A skip whose target entry row crosses no box on any intermediate rank
  // runs straight through the diagram into the target's left side, exiting
  // through the source's right-side fan; the bottom lane is the fallback.
  // (No entry spreading or local returns here: LR boxes are three rows tall,
  // so the centre row is the only usable port on a side.)
  const isSkip = (e: Edge): boolean => e.from !== e.to && ranks[e.to] - ranks[e.from] > 1
  // A back-edge target's bottom-entry `▲` stub sits one row below its box;
  // a straight run through that cell would appear to carry the arrival.
  const stubRows = new Set<number>()
  for (const e of graph.edges) {
    if (e.from === e.to || ranks[e.to] >= ranks[e.from]) continue
    const t = e.to
    stubRows.add(sat(centers[t], half(sizes.boxH[t] + sizes.extraH[t])) + sizes.boxH[t])
  }
  const edgeStraight = new Array<boolean>(graph.edges.length).fill(false)
  graph.edges.forEach((e, i) => {
    if (!isSkip(e)) return
    const row = centers[e.to]
    edgeStraight[i] =
      !stubRows.has(row) &&
      graph.nodes.every(
        (_, j) =>
          ranks[j] <= ranks[e.from] ||
          ranks[j] >= ranks[e.to] ||
          Math.abs(centers[j] - row) > half(sizes.boxH[j] + sizes.extraH[j]),
      )
  })

  // Left-to-right edge labels sit in the gap after their source's column, so
  // each gap sizes to the widest label *leaving through it* — one long label
  // widens its own band, not the whole diagram. Straight skips label there
  // too; a self-loop's label hangs beside its own box (selfLabelW).
  const bandLabel = new Array<number>(maxRank + 1).fill(0)
  graph.edges.forEach((e, i) => {
    if (e.from === e.to) return
    if (ranks[e.to] !== ranks[e.from] + 1 && !edgeStraight[i]) return
    const verb = e.label === null ? 0 : Math.min(stringWidth(e.label), MAX_LABEL)
    const cards = [e.cardFrom, e.cardTo]
      .filter((c) => c !== undefined)
      .reduce((w, c) => w + stringWidth(c as string) + 1, 0)
    bandLabel[ranks[e.from]] = Math.max(bandLabel[ranks[e.from]], verb + cards)
  })

  const edgeBus = new Array<number>(graph.edges.length).fill(0)
  const busTracks = new Array<number>(maxRank + 1).fill(0)
  for (let r = 0; r < maxRank; r++) {
    const spans = busSpans(graph, ranks, centers, r, true, false)
    // Straight-skip departures ride their own band's bus tracks: endpoint
    // sharing folds them onto their siblings' column — one fan origin.
    graph.edges.forEach((e, i) => {
      if (!isSkip(e) || !edgeStraight[i] || ranks[e.from] !== r) return
      spans.push({
        start: Math.min(centers[e.from], centers[e.to]),
        end: Math.max(centers[e.from], centers[e.to]),
        from: e.from,
        to: e.to,
        edge: i,
      })
    })
    // Inner attachment can move an edge's row after placement; reserve a
    // track covering both boxes' full vertical extents.
    if (edgeInner !== undefined) {
      const boxT = (j: number): number => sat(centers[j], half(sizes.boxH[j] + sizes.extraH[j]))
      graph.edges.forEach((e, i) => {
        if (edgeInner[i] === undefined || e.from === e.to) return
        if (ranks[e.from] !== r || (ranks[e.to] !== r + 1 && !(isSkip(e) && edgeStraight[i])))
          return
        const span = {
          start: Math.min(boxT(e.from), boxT(e.to)),
          end: Math.max(
            boxT(e.from) + sizes.boxH[e.from] + sizes.extraH[e.from],
            boxT(e.to) + sizes.boxH[e.to] + sizes.extraH[e.to],
          ),
          from: e.from,
          to: e.to,
          edge: i,
        }
        const at = spans.findIndex((s) => s.edge === i)
        if (at === -1) spans.push(span)
        else spans[at] = span
      })
    }
    if (spans.length === 0) continue
    // A departing `<-->` head sits just right of the box; keep the first bus
    // column off it so a turn there does not erase the head.
    const base = graph.edges.some(
      (e) => e.from !== e.to && e.headFrom !== 'none' && ranks[e.from] === r && ranks[e.to] > r,
    )
      ? 1
      : 0
    const { assigned, count } = assignTracks(spans)
    for (const [idx, slot] of assigned) edgeBus[idx] = base + slot
    busTracks[r] = base + count
  }

  const rankX = new Array<number>(maxRank + 1).fill(0)
  for (let r = 1; r <= maxRank; r++) {
    const gap = Math.max(GAP_X + 1, bandLabel[r - 1] + 3, busTracks[r - 1] + 1)
    rankX[r] = rankX[r - 1] + colW[r - 1] + gap
  }
  const selfTails = byRank[maxRank]
    .filter((i) => sizes.extraH[i] > 0 && sizes.selfLabelW[i] > 0)
    .map((i) => 2 + sizes.selfLabelW[i])
  const canvasW =
    rankX[maxRank] + colW[maxRank] + (selfTails.length === 0 ? 0 : Math.max(...selfTails))
  const bandEnd = Array.from({ length: maxRank + 1 }, (_, r) => rankX[r] + colW[r])
  const rankStart = rankX

  let diagramH = 1
  byRank.forEach((row, r) => {
    const x = rankX[r]
    for (const idx of row) {
      const w = sizes.boxW[idx]
      const h = sizes.boxH[idx]
      const cy = centers[idx]
      const y = sat(cy, half(h + sizes.extraH[idx]))
      placed[idx] = { x, y, w, h, cx: x + half(w), cy: y + half(h), rank: r }
      diagramH = Math.max(diagramH, y + h + sizes.extraH[idx])
    }
  })

  const edgeLaneX = new Array<number>(graph.edges.length).fill(0)
  const lanes = laneSpans(graph, ranks, placed, false).filter((s) => !edgeStraight[s.edge])
  let canvasH = diagramH
  if (lanes.length > 0) {
    const { assigned, count } = assignTracks(lanes, true)
    for (const [idx, slot] of assigned) edgeLaneX[idx] = diagramH + 1 + slot
    canvasH = diagramH + 1 + count
  }

  return {
    canvasW,
    canvasH,
    bandEnd,
    rankStart,
    edgeBus,
    edgeLaneX,
    skipApproach: new Array<number>(maxRank + 1).fill(-1),
    edgeEntryX: new Array<number>(graph.edges.length).fill(-1),
    edgeStraight,
    fwdEntryX: new Array<number>(graph.nodes.length).fill(-1),
    edgeLabelLeft: new Array<boolean>(graph.edges.length).fill(false),
  }
}

// -------------------------------------------------------------------- canvas

/** Inner-node attachment for an edge lifted onto a frame: the true
 * endpoint's rect in the frame's sub-canvas coordinates. */
export interface EdgeInner {
  from?: Placed
  to?: Placed
}

/**
 * Rank, place, draw and route a graph onto a fresh canvas.
 *
 * `edgeInner` (parallel to `graph.edges`) lets an edge lifted onto a frame
 * node attach to the true node inside it when a blank corridor allows;
 * `outPlaced` receives the final node rects for the caller.
 */
export function layoutCanvas(
  graph: Graph,
  extras: NodeExtra[],
  edgeInner?: (EdgeInner | undefined)[],
  outPlaced?: Placed[],
): CanvasResult {
  const n = graph.nodes.length
  if (n === 0) return null

  // Parallel edges ride the same cells, so all labels after the first were
  // silently lost — join them onto the first instead. Done before sizing so
  // the joined label gets its room.
  const firstOf = new Map<string, number>()
  graph.edges.forEach((e, i) => {
    if (e.from === e.to) return
    const key = `${e.from}>${e.to}`
    const first = firstOf.get(key)
    if (first === undefined) {
      firstOf.set(key, i)
      return
    }
    if (e.label !== null) {
      const head = graph.edges[first].label
      graph.edges[first].label = head === null ? e.label : `${head} / ${e.label}`
      e.label = null
    }
  })

  const ranks = computeRanks(graph)
  const maxRank = Math.max(...ranks, 0)

  const byRank: number[][] = Array.from({ length: maxRank + 1 }, () => [])
  for (let idx = 0; idx < ranks.length; idx++) byRank[ranks[idx]].push(idx)
  orderRanks(byRank, graph.edges, ranks)

  // Lane edges exit toward their lane strip's side; the endpoints order
  // first (left) / last (right) within their ranks, or whatever the ordering
  // put beyond them would sit in that corridor and be cut through. Vertical
  // layouts lane on both sides — an edge takes the side its endpoints lean
  // toward; LR keeps its single bottom strip.
  const vertical = graph.dir === 'down' || graph.dir === 'up'
  const edgeSide: ('left' | 'right')[] = graph.edges.map(() => 'right')
  const frac = new Array<number>(graph.nodes.length).fill(0.5)
  for (const row of byRank) {
    row.forEach((v, i) => {
      frac[v] = row.length <= 1 ? 0.5 : i / (row.length - 1)
    })
  }
  // A node serving lanes on both sides keeps the right corridor: right wins.
  const laneKey = new Array<number>(graph.nodes.length).fill(0)
  graph.edges.forEach((e, i) => {
    if (e.from === e.to || ranks[e.to] === ranks[e.from] + 1) return
    if (vertical && isAdjacentBack(ranks, e)) return
    const left = vertical && (frac[e.from] + frac[e.to]) / 2 < 0.5
    if (left) edgeSide[i] = 'left'
    for (const n of [e.from, e.to]) laneKey[n] = left ? laneKey[n] || -1 : 1
  })
  for (const row of byRank) row.sort((a, b) => laneKey[a] - laneKey[b])

  const wrapped = graph.nodes.map((node) => wrapLabel(node.label, WRAP_WIDTH, MAX_LINES))
  const widest = (lines: string[]): number =>
    Math.max(1, lines.length === 0 ? 1 : Math.max(...lines.map(stringWidth)))

  const boxW = extras.map((extra, i) => {
    if (extra.kind === 'frame') {
      return Math.max(
        extra.sub.w + 2 + 2 * PAD,
        stringWidth(fitLabel(graph.nodes[i].label, WRAP_WIDTH)) + 4,
      )
    }
    if (extra.kind === 'compartments') return widest(extra.sections.flat()) + 2 * PAD + 2
    return widest(wrapped[i]) + 2 * PAD + 2
  })
  const boxH = extras.map((extra, i) => {
    if (extra.kind === 'frame') return extra.sub.h + 2
    if (extra.kind === 'compartments') {
      const filled = extra.sections.filter((s) => s.length > 0).length
      return extra.sections.reduce((s, sec) => s + sec.length, 0) + sat(filled, 1) + 2
    }
    return wrapped[i].length + 2
  })

  // A self-edge needs two rows below its box, and room beside it for a label.
  const extraH = new Array<number>(n).fill(0)
  const selfLabelW = new Array<number>(n).fill(0)
  for (const e of graph.edges) {
    if (e.from !== e.to) continue
    extraH[e.from] = 2
    const text = edgeText(e)
    if (text !== null) {
      selfLabelW[e.from] = Math.max(selfLabelW[e.from], Math.min(stringWidth(text), MAX_LABEL))
    }
  }
  for (let i = 0; i < n; i++) if (extraH[i] > 0) boxW[i] = Math.max(boxW[i], 7)

  const sizes: NodeSizes = {
    boxW,
    boxH,
    layW: boxW.map((w, i) => w + (selfLabelW[i] > 0 ? 2 * (selfLabelW[i] + 3) : 0)),
    layH: boxH.map((h, i) => h + extraH[i]),
    extraH,
    selfLabelW,
  }

  const placed: Placed[] = Array.from({ length: n }, () => ({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    cx: 0,
    cy: 0,
    rank: 0,
  }))

  const plan = vertical
    ? placeTd(ranks, maxRank, byRank, sizes, graph, placed, edgeSide, edgeInner)
    : placeLr(ranks, maxRank, byRank, sizes, graph, placed, edgeInner)

  if (plan.canvasW * plan.canvasH > MAX_CANVAS_CELLS) return null

  const canvas = new Canvas(plan.canvasW, plan.canvasH)
  for (let idx = 0; idx < n; idx++) {
    const extra = extras[idx]
    canvas.curTag = graph.nodes[idx].classes?.join(' ')
    canvas.curHref = graph.nodes[idx].href
    // `BT` mirrors the finished canvas; multi-row content draws upside down so
    // the flip restores reading order (flipHorizontal's text runs, vertically).
    const mirrored = graph.dir === 'up'
    if (extra.kind === 'frame')
      drawFrame(canvas, placed[idx], graph.nodes[idx].label, extra.sub, mirrored)
    else if (extra.kind === 'compartments')
      drawClassBox(canvas, placed[idx], extra.sections, mirrored)
    else drawBox(canvas, placed[idx], wrapped[idx], graph.nodes[idx].shape, mirrored)
  }
  canvas.curTag = undefined
  canvas.curHref = undefined

  // A frame endpoint with a known inner-node rect attaches to the node
  // itself when a blank corridor runs between it and the frame border.
  const innerAbs = (frameIdx: number, r: Placed): Placed | null => {
    const p = placed[frameIdx]
    const extra = extras[frameIdx]
    if (extra.kind !== 'frame') return null
    const ox = p.x + 1 + half(p.w - 2 - extra.sub.w)
    const oy = p.y + 1 + half(p.h - 2 - extra.sub.h)
    return { ...r, x: r.x + ox, y: r.y + oy, cx: r.cx + ox, cy: r.cy + oy, rank: p.rank }
  }
  const attach = (frameIdx: number, r: Placed | undefined, side: CorridorSide): Placed | null => {
    if (r === undefined) return null
    const abs = innerAbs(frameIdx, r)
    if (abs === null) return null
    const at = openCorridor(canvas, placed[frameIdx], abs, side)
    if (at === null) return null
    if (side === 'top' || side === 'bottom') abs.cx = at
    else abs.cy = at
    return abs
  }

  const laneLabels: LaneLabel[] = []
  graph.edges.forEach((edge, i) => {
    canvas.curStyle =
      edge.line === 'dotted' ? STY_DOT : edge.line === 'thick' ? STY_THICK : STY_SOLID
    if (edge.from === edge.to) {
      routeSelf(canvas, placed[edge.from], edge)
      return
    }
    let from = placed[edge.from]
    let to = placed[edge.to]
    const adjacent = to.rank === from.rank + 1
    const adjacentBack = from.rank === to.rank + 1
    // A back edge crosses the band below its *target's* rank.
    const bus = plan.bandEnd[(adjacentBack ? to : from).rank] + plan.edgeBus[i]
    const lane = plan.edgeLaneX[i]
    // Which frame side each endpoint's corridor must pierce for this route.
    const left = edgeSide[i] === 'left'
    let fromSide: CorridorSide
    let toSide: CorridorSide
    if (vertical) {
      if (adjacent || to.rank > from.rank) [fromSide, toSide] = ['bottom', 'top']
      else if (adjacentBack) [fromSide, toSide] = ['top', 'bottom']
      else fromSide = toSide = left ? 'left' : 'right'
    } else if (adjacent || (to.rank > from.rank && plan.edgeStraight[i])) {
      ;[fromSide, toSide] = ['right', 'left']
    } else {
      fromSide = toSide = 'bottom'
    }
    const inner = edgeInner?.[i]
    const innerFrom = inner?.from !== undefined ? attach(edge.from, inner.from, fromSide) : null
    const innerTo = inner?.to !== undefined ? attach(edge.to, inner.to, toSide) : null
    if (innerFrom !== null) from = innerFrom
    if (innerTo !== null) to = innerTo
    // Frame-top entry slots assume the frame box; an inner target reverts to
    // its own centre column.
    const fwdEntry = innerTo !== null ? -1 : plan.fwdEntryX[edge.to]
    const skipEntry = innerTo !== null ? to.cx : plan.edgeEntryX[i]
    if (vertical) {
      if (adjacent) routeForward(canvas, from, to, edge, bus, fwdEntry, plan.edgeLabelLeft[i])
      else if (adjacentBack) routeBackAdjacent(canvas, from, to, edge, bus)
      else if (to.rank > from.rank) {
        routeSkip(canvas, from, to, edge, {
          laneX: lane,
          entryX: skipEntry,
          busY: bus,
          approachY: plan.skipApproach[to.rank],
          straight: plan.edgeStraight[i],
          labelLeft: plan.edgeLabelLeft[i],
        })
      } else routeBack(canvas, from, to, edge, lane, left)
    } else if (adjacent) {
      routeForwardLr(canvas, from, to, edge, bus)
    } else if (to.rank > from.rank && plan.edgeStraight[i]) {
      routeSkipLr(canvas, from, to, edge, bus)
    } else {
      routeBackLr(canvas, from, to, edge, lane, laneLabels)
    }
  })
  placeLaneLabels(canvas, laneLabels)

  canvas.finalizeMask()
  if (outPlaced !== undefined) outPlaced.push(...placed)
  return canvas
}

/** Apply the direction flip a finished canvas needs for `BT` / `RL`. */
export function orient(canvas: Canvas, graph: Graph): Canvas {
  if (graph.dir === 'up') canvas.flipVertical()
  else if (graph.dir === 'left') canvas.flipHorizontal()
  return canvas
}

/** Flowchart and state diagrams: plain boxes, no extra content. */
export function layoutFlowchart(graph: Graph): CanvasResult {
  const extras: NodeExtra[] = graph.nodes.map(() => ({ kind: 'plain' }))
  const canvas = layoutCanvas(graph, extras)
  return canvas && orient(canvas, graph)
}

/** Class and ER diagrams: boxes divided into title / attribute / method rows. */
export function layoutClass(graph: Graph): CanvasResult {
  const extras: NodeExtra[] = graph.nodes.map((node) => ({
    kind: 'compartments',
    sections: node.sections ?? [[node.label]],
  }))
  const canvas = layoutCanvas(graph, extras)
  return canvas && orient(canvas, graph)
}

// -------------------------------------------------------------------- groups

/** An endpoint inside a scope: a plain node or a (proxied) subgraph. */
interface ScopeItem {
  group: boolean
  i: number
}

/**
 * Lay out a flowchart that uses `subgraph`.
 *
 * Each subgraph becomes a framed box holding its own independently laid-out
 * canvas. An edge is drawn in the innermost scope containing both endpoints;
 * one crossing a subgraph boundary attaches to the frame instead of the node.
 */
export function layoutGrouped(graph: Graph): CanvasResult {
  // A node whose id matches a subgraph id stands in for that subgraph.
  const proxy = new Map<number, number>()
  graph.groups.forEach((g, gi) => {
    const ni = graph.index.get(g.id)
    if (ni !== undefined) proxy.set(ni, gi)
  })

  const groupChain = (g: number | null): number[] => {
    const chain: number[] = []
    let cur = g
    while (cur !== null) {
      chain.push(cur)
      cur = graph.groups[cur].parent
    }
    return chain.reverse()
  }
  const endpoint = (n: number): { item: ScopeItem; chain: number[] } => {
    const gi = proxy.get(n)
    return gi === undefined
      ? { item: { group: false, i: n }, chain: groupChain(graph.nodeGroup[n]) }
      : { item: { group: true, i: gi }, chain: groupChain(graph.groups[gi].parent) }
  }

  /** Edges bucketed by the scope that draws them; `null` is the top level. */
  const scopeEdges = new Map<number | null, [ScopeItem, ScopeItem, number][]>()
  const referenced = new Array<boolean>(graph.groups.length).fill(false)
  // Groups a node-level edge crosses out of. Mermaid ignores a subgraph's
  // `direction` when any of its nodes links outside; the override would
  // reorient a box whose layout the outer scope already committed to.
  const crossed = new Array<boolean>(graph.groups.length).fill(false)
  graph.edges.forEach((e, ei) => {
    const f = endpoint(e.from)
    const t = endpoint(e.to)
    let k = 0
    while (k < f.chain.length && k < t.chain.length && f.chain[k] === t.chain[k]) k++
    const scope = k === 0 ? null : f.chain[k - 1]
    const fItem = f.chain.length > k ? { group: true, i: f.chain[k] } : f.item
    const tItem = t.chain.length > k ? { group: true, i: t.chain[k] } : t.item
    for (const item of [fItem, tItem]) {
      if (item.group) referenced[item.i] = true
    }
    for (const chain of [f.chain, t.chain]) {
      for (let j = k; j < chain.length; j++) crossed[chain[j]] = true
    }
    const list = scopeEdges.get(scope)
    if (list) list.push([fItem, tItem, ei])
    else scopeEdges.set(scope, [[fItem, tItem, ei]])
  })

  const directNodes = new Map<number | null, number[]>()
  graph.nodeGroup.forEach((g, ni) => {
    if (proxy.has(ni)) return
    const list = directNodes.get(g)
    if (list) list.push(ni)
    else directNodes.set(g, [ni])
  })

  // Drop empty subgraphs, but keep any that an edge attaches to. Walked by
  // the actual child relation: state `--` regions reparent earlier groups
  // under later ones, so index order says nothing about depth.
  const childGroups: number[][] = graph.groups.map(() => [])
  graph.groups.forEach((g, gi) => {
    if (g.parent !== null) childGroups[g.parent].push(gi)
  })
  const keep = new Array<boolean>(graph.groups.length).fill(false)
  const visit = (gi: number): boolean => {
    let kept = referenced[gi] || (directNodes.get(gi) ?? []).length > 0
    for (const c of childGroups[gi]) if (visit(c)) kept = true
    keep[gi] = kept
    return kept
  }
  graph.groups.forEach((g, gi) => {
    if (g.parent === null) visit(gi)
  })

  const res = buildScope(graph, null, scopeEdges, directNodes, keep, crossed, graph.dir)
  return res && orient(res.canvas, graph)
}

/** A laid-out scope: its canvas plus every contained node's rect (original
 * graph indices, this scope's canvas coordinates) for inner attachment. */
interface ScopeResult {
  canvas: Canvas
  rects: Map<number, Placed>
}

function buildScope(
  graph: Graph,
  scope: number | null,
  scopeEdges: Map<number | null, [ScopeItem, ScopeItem, number][]>,
  directNodes: Map<number | null, number[]>,
  keep: boolean[],
  crossed: boolean[],
  dir: Dir,
): ScopeResult | null {
  const items: ScopeItem[] = (directNodes.get(scope) ?? []).map((i) => ({ group: false, i }))
  const childGroups = graph.groups
    .map((_, gi) => gi)
    .filter((gi) => graph.groups[gi].parent === scope && keep[gi])
  items.push(...childGroups.map((i) => ({ group: true, i })))

  if (items.length === 0) return { canvas: new Canvas(1, 1), rects: new Map() }

  const nodeAt = new Map<number, number>()
  const groupAt = new Map<number, number>()
  const subResults = new Map<number, ScopeResult>()
  const nodes: Node[] = []
  const extras: NodeExtra[] = []
  for (const item of items) {
    ;(item.group ? groupAt : nodeAt).set(item.i, nodes.length)
    if (!item.group) {
      nodes.push({
        label: graph.nodes[item.i].label,
        shape: graph.nodes[item.i].shape,
        classes: graph.nodes[item.i].classes,
        href: graph.nodes[item.i].href,
      })
      extras.push({ kind: 'plain' })
    } else {
      // A subgraph `direction` override applies only under a non-flipping
      // root (a flipped ancestor mirrors blitted sub-canvases wholesale)
      // and only when no node inside links outside, matching mermaid.
      const subDir =
        (graph.dir === 'down' || graph.dir === 'right') && !crossed[item.i]
          ? (graph.groups[item.i].dir ?? dir)
          : dir
      const sub = buildScope(graph, item.i, scopeEdges, directNodes, keep, crossed, subDir)
      if (sub === null) return null
      subResults.set(item.i, sub)
      nodes.push({ label: graph.groups[item.i].label, shape: 'rect' })
      extras.push({ kind: 'frame', sub: sub.canvas })
    }
  }

  const edges: Edge[] = []
  const edgeInner: (EdgeInner | undefined)[] = []
  for (const [f, t, ei] of scopeEdges.get(scope) ?? []) {
    const fi = (f.group ? groupAt : nodeAt).get(f.i)
    const ti = (t.group ? groupAt : nodeAt).get(t.i)
    if (fi === undefined || ti === undefined) continue
    const e = graph.edges[ei]
    edges.push({
      from: fi,
      to: ti,
      label: e.label,
      headTo: e.headTo,
      headFrom: e.headFrom,
      line: e.line,
    })
    // A lifted endpoint remembers the true node's rect inside its frame, so
    // routing can pierce the frame and attach to the node itself.
    const ann: EdgeInner = {}
    if (f.group) ann.from = subResults.get(f.i)?.rects.get(e.from)
    if (t.group) ann.to = subResults.get(t.i)?.rects.get(e.to)
    edgeInner.push(ann.from !== undefined || ann.to !== undefined ? ann : undefined)
  }

  // Layout only reads nodes/edges/dir, so a bare Graph carrying those is enough.
  const synth = new Graph(dir)
  synth.nodes = nodes
  synth.edges = edges
  const outPlaced: Placed[] = []
  const canvas = layoutCanvas(synth, extras, edgeInner, outPlaced)
  if (canvas === null) return null

  const rects = new Map<number, Placed>()
  for (const item of items) {
    const local = (item.group ? groupAt : nodeAt).get(item.i)
    if (local === undefined) continue
    const p = outPlaced[local]
    if (!item.group) {
      rects.set(item.i, p)
    } else {
      // The blit offset drawFrame used: sub-canvas centred in the frame.
      const sub = subResults.get(item.i)
      if (sub === undefined) continue
      const ox = p.x + 1 + half(p.w - 2 - sub.canvas.w)
      const oy = p.y + 1 + half(p.h - 2 - sub.canvas.h)
      for (const [ni, r] of sub.rects) {
        rects.set(ni, { ...r, x: r.x + ox, y: r.y + oy, cx: r.cx + ox, cy: r.cy + oy })
      }
    }
  }
  return { canvas, rects }
}

// ------------------------------------------------------------------- drawing

export function drawBox(
  canvas: Canvas,
  p: Placed,
  lines: string[],
  shape: Shape,
  mirrored = false,
): void {
  const { x, y, w, h } = p
  const right = x + w - 1
  const bottom = y + h - 1

  // A diamond is a double-line box — the terminal's nod to `A{...}`.
  const [tl, tr, bl, br] =
    shape === 'diamond'
      ? ['╔', '╗', '╚', '╝']
      : shape === 'round'
        ? ['╭', '╮', '╰', '╯']
        : ['┌', '┐', '└', '┘']
  canvas.set(x, y, tl, 'border')
  canvas.set(right, y, tr, 'border')
  canvas.set(x, bottom, bl, 'border')
  canvas.set(right, bottom, br, 'border')

  if (shape === 'diamond') {
    // Double lines have no direction bits; edges tee into them through the
    // mixed junctions (`╤` `╧` `╟` `╢`) that `finalizeMask` resolves.
    for (let cx = x + 1; cx < right; cx++) {
      canvas.set(cx, y, '═', 'border')
      canvas.set(cx, bottom, '═', 'border')
    }
    for (let cy = y + 1; cy < bottom; cy++) {
      canvas.set(x, cy, '║', 'border')
      canvas.set(right, cy, '║', 'border')
    }
  } else {
    // The perimeter is drawn as bits so edges can tee into it, but it is the
    // box outline, so it claims `border` rather than `edge`.
    for (let cx = x + 1; cx < right; cx++) {
      canvas.addBits(cx, y, L | R, 'border')
      canvas.addBits(cx, bottom, L | R, 'border')
    }
    for (let cy = y + 1; cy < bottom; cy++) {
      canvas.addBits(x, cy, U | D, 'border')
      canvas.addBits(right, cy, U | D, 'border')
    }
  }

  for (let cy = y; cy <= bottom; cy++) {
    for (let cx = x; cx <= right; cx++) {
      const i = canvas.idx(cx, cy)
      canvas.occupied[i] = 1
      if (canvas.curTag !== undefined) canvas.tag[i] = canvas.curTag
      if (canvas.curHref !== undefined) canvas.href[i] = canvas.curHref
    }
  }

  const inner = Math.max(1, sat(w, 2 * PAD + 2))
  const ordered = mirrored ? [...lines].reverse() : lines
  ordered.forEach((line, li) => {
    const text = fitLabel(line, inner)
    const textX = x + 1 + PAD + half(sat(inner, stringWidth(text)))
    drawText(canvas, text, textX, y + 1 + li, 'text')
  })
}

/** A class or ER box: sections separated by horizontal rules, title centred. */
function drawClassBox(canvas: Canvas, p: Placed, sections: string[][], mirrored = false): void {
  drawBox(canvas, p, [], 'rect')
  const inner = Math.max(1, sat(p.w, 2 * PAD + 2))
  const rows: ({ sep: true } | { sep?: undefined; text: string; center: boolean })[] = []
  sections.forEach((section, si) => {
    if (section.length === 0) return
    if (rows.length > 0) rows.push({ sep: true })
    for (const line of section) rows.push({ text: fitLabel(line, inner), center: si === 0 })
  })
  if (mirrored) rows.reverse()
  rows.forEach((r, ri) => {
    const row = p.y + 1 + ri
    if (r.sep) {
      canvas.set(p.x, row, '├', 'border')
      for (let x = p.x + 1; x < p.x + p.w - 1; x++) canvas.set(x, row, '─', 'border')
      canvas.set(p.x + p.w - 1, row, '┤', 'border')
    } else {
      const tx = r.center ? p.x + 1 + PAD + half(sat(inner, stringWidth(r.text))) : p.x + 1 + PAD
      drawTextOverEdges(canvas, r.text, tx, row, 'text')
    }
  })
}

/** A subgraph frame: a titled box with a finished sub-canvas centred inside. */
function drawFrame(canvas: Canvas, p: Placed, title: string, sub: Canvas, mirrored = false): void {
  drawBox(canvas, p, [], 'rect')
  // An unlabelled frame (a state `--` region) keeps its border unbroken.
  if (title !== '') {
    const t = fitLabel(title, sat(p.w, 4))
    // Mirrored: the bottom border becomes the top after the flip.
    drawTextOverEdges(canvas, ` ${t} `, p.x + 1, mirrored ? p.y + p.h - 1 : p.y, 'text')
  }
  canvas.blit(sub, p.x + 1 + half(p.w - 2 - sub.w), p.y + 1 + half(p.h - 2 - sub.h))
}

// ------------------------------------------------------------------- routing

type CorridorSide = 'top' | 'bottom' | 'left' | 'right'

/**
 * Open a straight corridor between a frame's border and a node inside it,
 * so an outer edge can attach to the node itself: every cell between must
 * be blank (a box in the way announces itself by its border glyphs first),
 * the cells are then released for edge bits — `blit` marks the whole frame
 * occupied — and the border cell gets through-bits. The node's centre is
 * tried first, then nearby columns/rows across its span — a frame title
 * may cover the border over the centre. Returns the chosen column (top/
 * bottom) or row (left/right), or null untouched; the caller falls back to
 * the frame attachment. A node flush against the border needs no corridor:
 * the arrowhead lands on the pierced border cell itself.
 */
function openCorridor(
  canvas: Canvas,
  frame: Placed,
  inner: Placed,
  side: CorridorSide,
): number | null {
  const horizontal = side === 'top' || side === 'bottom'
  const centre = horizontal ? inner.cx : inner.cy
  const lo = horizontal ? inner.x + 1 : inner.y + 1
  const hi = horizontal ? inner.x + inner.w - 2 : inner.y + inner.h - 2
  const attempt = (at: number): boolean => {
    const cells: [number, number][] = []
    let pierce: [number, number, number]
    if (side === 'top') {
      for (let y = frame.y + 1; y < inner.y; y++) cells.push([at, y])
      pierce = [at, frame.y, U | D]
    } else if (side === 'bottom') {
      for (let y = inner.y + inner.h; y < frame.y + frame.h - 1; y++) cells.push([at, y])
      pierce = [at, frame.y + frame.h - 1, U | D]
    } else if (side === 'left') {
      for (let x = frame.x + 1; x < inner.x; x++) cells.push([x, at])
      pierce = [frame.x, at, L | R]
    } else {
      for (let x = inner.x + inner.w; x < frame.x + frame.w - 1; x++) cells.push([x, at])
      pierce = [frame.x + frame.w - 1, at, L | R]
    }
    if (!canvas.canPierce(pierce[0], pierce[1])) return false
    for (const [x, y] of cells) {
      const ci = canvas.idx(x, y)
      if (canvas.ch[ci] !== ' ' || canvas.mask[ci] !== 0) return false
    }
    for (const [x, y] of cells) canvas.occupied[canvas.idx(x, y)] = 0
    canvas.junction(pierce[0], pierce[1], pierce[2])
    return true
  }
  for (let d = 0; centre - d >= lo || centre + d <= hi; d++) {
    for (const at of d === 0 ? [centre] : [centre + d, centre - d]) {
      if (at >= lo && at <= hi && attempt(at)) return at
    }
  }
  return null
}

export function headGlyph(head: Head, arrow: string): string {
  switch (head) {
    case 'circle':
      return 'o'
    case 'cross':
      return '×'
    case 'diamondFill':
      return '◆'
    case 'diamondOpen':
      return '◇'
    case 'triangle':
      return { '▼': '▽', '▲': '△', '◄': '◁', '▶': '▷' }[arrow] ?? arrow
    default:
      return arrow
  }
}

/** Adjacent ranks, top-down: drop, jog along the bus row, drop into the head.
 * `entryX` overrides the centre entry column when the target's top is shared
 * with skip entries; `labelLeft` renders the label left of the arrowhead. */
function routeForward(
  canvas: Canvas,
  from: Placed,
  to: Placed,
  edge: Edge,
  bus: number,
  entryX = -1,
  labelLeft = false,
): void {
  const tx = entryX === -1 ? to.cx : entryX
  // A jog of one column reads as a kink; snap straight instead.
  const bx = Math.abs(from.cx - tx) <= 1 ? tx : from.cx
  const by = from.y + from.h - 1
  const headRow = to.y - 1

  // A `<-->` source head sits outside the border like the target head does;
  // the border keeps its plain line instead of a tee.
  if (edge.headFrom === 'none') canvas.junction(bx, by, D)
  canvas.segV(bx, edge.headFrom === 'none' ? by : by + 1, bus)
  if (bx === tx) {
    canvas.segV(bx, bus, headRow)
  } else {
    canvas.segH(bus, bx, tx)
    canvas.segV(tx, bus, headRow)
  }

  if (edge.headTo === 'none') canvas.addBits(tx, headRow, U)
  else canvas.set(tx, headRow, headGlyph(edge.headTo, '▼'), 'edge')
  if (edge.headFrom !== 'none') canvas.set(bx, by + 1, headGlyph(edge.headFrom, '▲'), 'edge')

  if (edge.cardFrom === undefined && edge.cardTo === undefined) {
    if (edge.label !== null) {
      if (labelLeft) {
        placeLabel(
          canvas,
          edge.label,
          headRow,
          sat(tx, Math.min(stringWidth(edge.label), MAX_LABEL)),
        )
      } else {
        placeLabelSided(canvas, edge.label, headRow, tx)
      }
    }
    return
  }
  // Cardinalities sit at their own ends; the verb takes the row above the
  // head, falling back beside the target card when the gap has no spare row.
  const srcRow = by + 1
  if (edge.cardFrom !== undefined) placeLabel(canvas, edge.cardFrom, srcRow, bx + 1)
  if (edge.cardTo !== undefined) placeLabel(canvas, edge.cardTo, headRow, tx + 1)
  if (edge.label !== null) {
    const midRow = headRow - 1
    if (midRow > srcRow) {
      const lineX = midRow > bus ? tx : bx
      placeLabel(canvas, edge.label, midRow, lineX + 1)
    } else {
      placeLabel(
        canvas,
        edge.label,
        headRow,
        tx + 1 + (edge.cardTo === undefined ? 0 : stringWidth(edge.cardTo) + 1),
      )
    }
  }
}

/**
 * Adjacent ranks, top-down, against the flow: up out of the source's top,
 * jog along the band, arrow into the target's bottom. The short local return
 * mermaid draws — not a trip around the diagram.
 */
function routeBackAdjacent(
  canvas: Canvas,
  from: Placed,
  to: Placed,
  edge: Edge,
  bus: number,
): void {
  // Attach right of centre so the return does not merge with the forward
  // exits and arrivals that own the centre column.
  const tx = Math.min(to.x + to.w - 2, to.cx + 2)
  const bx0 = Math.min(from.x + from.w - 2, from.cx + 2)
  const bx = Math.abs(bx0 - tx) <= 1 ? tx : bx0
  const fy = from.y
  const headRow = to.y + to.h
  const exitY = edge.headFrom === 'none' ? fy : fy - 1

  if (edge.headFrom === 'none') canvas.junction(bx, fy, U)
  if (bx === tx) {
    canvas.segV(bx, headRow, exitY)
  } else {
    canvas.segV(bx, bus, exitY)
    canvas.segH(bus, bx, tx)
    canvas.segV(tx, headRow, bus)
  }

  if (edge.headTo === 'none') canvas.addBits(tx, headRow, D)
  else canvas.set(tx, headRow, headGlyph(edge.headTo, '▲'), 'edge')
  if (edge.headFrom !== 'none') canvas.set(bx, fy - 1, headGlyph(edge.headFrom, '▼'), 'edge')

  const text = edgeText(edge)
  if (text !== null) placeLabelSided(canvas, text, headRow, tx)
}

/** A self-edge: a stub loop hanging below the box. */
function routeSelf(canvas: Canvas, p: Placed, edge: Edge): void {
  const bottom = p.y + p.h - 1
  const exitX = p.cx + 1
  const retX = p.x + p.w - 2
  if (retX <= exitX || bottom + 2 >= canvas.h) return

  const [v, h, bl, br] =
    edge.line === 'dotted'
      ? ['╎', '╌', '╰', '╯']
      : edge.line === 'thick'
        ? ['┃', '━', '┗', '┛']
        : ['│', '─', '╰', '╯']

  canvas.junction(exitX, bottom, D)
  canvas.set(exitX, bottom + 1, v, 'edge')
  canvas.set(exitX, bottom + 2, bl, 'edge')
  for (let x = exitX + 1; x < retX; x++) canvas.set(x, bottom + 2, h, 'edge')
  canvas.set(retX, bottom + 2, br, 'edge')
  canvas.set(retX, bottom + 1, headGlyph(edge.headTo, '▲'), 'edge')
  const selfText = edgeText(edge)
  if (selfText !== null) placeLabel(canvas, selfText, bottom + 1, p.x + p.w + 1)
}

/**
 * Forward skip edge, top-down: out the source's *bottom* onto its band's bus
 * row (endpoint sharing folds it onto its siblings' row — one `┴` origin
 * split), then either straight down an unobstructed column into the
 * target's *top*, or around: down the lane and in along the reserved
 * approach row above the target's rank, over the arrival heads and labels.
 */
function routeSkip(
  canvas: Canvas,
  from: Placed,
  to: Placed,
  edge: Edge,
  at: {
    laneX: number
    entryX: number
    busY: number
    approachY: number
    straight: boolean
    labelLeft: boolean
  },
): void {
  const { laneX, entryX, busY, approachY, straight, labelLeft } = at
  const bx = from.cx
  const bottom = from.y + from.h - 1

  if (edge.headFrom === 'none') canvas.junction(bx, bottom, D)
  canvas.segV(bx, edge.headFrom === 'none' ? bottom : bottom + 1, busY)
  if (straight) {
    canvas.segH(busY, bx, entryX)
    canvas.segV(entryX, busY, to.y - 1)
  } else {
    canvas.segH(busY, bx, laneX)
    canvas.segV(laneX, busY, approachY)
    canvas.segH(approachY, entryX, laneX)
    canvas.segV(entryX, approachY, to.y - 1)
  }

  if (edge.headTo === 'none') canvas.addBits(entryX, to.y - 1, D)
  else canvas.set(entryX, to.y - 1, headGlyph(edge.headTo, '▼'), 'edge')
  if (edge.headFrom !== 'none') canvas.set(bx, bottom + 1, headGlyph(edge.headFrom, '▲'), 'edge')

  const text = edgeText(edge)
  if (text !== null) {
    if (labelLeft) {
      placeLabel(canvas, text, to.y - 1, sat(entryX, Math.min(stringWidth(text), MAX_LABEL)))
    } else {
      placeLabelSided(canvas, text, to.y - 1, entryX)
    }
  }
}

/**
 * Multi-rank back edge, top-down: out the side, up a lane, back in through
 * the target's same side — side entry keeps returns recognisable at a
 * glance. Lanes run on whichever side the endpoints lean toward.
 */
function routeBack(
  canvas: Canvas,
  from: Placed,
  to: Placed,
  edge: Edge,
  laneX: number,
  left = false,
): void {
  const sx = left ? from.x : from.x + from.w - 1
  const sy = from.cy
  const backText = edgeText(edge)

  const exitX = edge.headFrom === 'none' ? sx : left ? sx - 1 : sx + 1
  if (edge.headFrom === 'none') canvas.junction(sx, sy, left ? L : R)
  canvas.segH(sy, exitX, laneX)
  if (edge.headFrom !== 'none') {
    canvas.set(exitX, sy, headGlyph(edge.headFrom, left ? '▶' : '◄'), 'edge')
  }

  const hx = left ? to.x - 1 : to.x + to.w
  const tyc = to.cy
  canvas.segV(laneX, sy, tyc)
  canvas.segH(tyc, hx, laneX)
  if (edge.headTo === 'none') canvas.addBits(hx, tyc, left ? L : R)
  else canvas.set(hx, tyc, headGlyph(edge.headTo, left ? '▶' : '◄'), 'edge')
  if (backText !== null) {
    const start = left ? laneX + 1 : sat(laneX, stringWidth(backText) + 1)
    placeLabel(canvas, backText, sat(tyc, 1), start)
  }
}

/** Adjacent ranks, left-to-right: out the right side, jog on the bus column. */
function routeForwardLr(canvas: Canvas, from: Placed, to: Placed, edge: Edge, bus: number): void {
  const rx = from.x + from.w - 1
  const ry = from.cy
  const ly = to.cy
  const headCol = to.x - 1

  if (edge.headFrom === 'none') canvas.junction(rx, ry, R)
  canvas.segH(ry, edge.headFrom === 'none' ? rx : rx + 1, bus)
  if (ry === ly) {
    canvas.segH(ry, bus, headCol)
  } else {
    canvas.segV(bus, ry, ly)
    canvas.segH(ly, bus, headCol)
  }

  if (edge.headTo === 'none') canvas.addBits(headCol, ly, R)
  else canvas.set(headCol, ly, headGlyph(edge.headTo, '▶'), 'edge')
  if (edge.headFrom !== 'none') canvas.set(rx + 1, ry, headGlyph(edge.headFrom, '◄'), 'edge')

  // The verb keeps its usual spot above the line; cardinalities hug their
  // own ends on the rows above the departure and arrival cells.
  if (edge.label !== null) placeLabel(canvas, edge.label, sat(ly, 1), bus + 1)
  if (edge.cardFrom !== undefined) placeLabel(canvas, edge.cardFrom, sat(ry, 1), rx + 1)
  if (edge.cardTo !== undefined) {
    placeLabel(canvas, edge.cardTo, sat(ly, 1), sat(headCol, stringWidth(edge.cardTo)))
  }
}

/**
 * Straight forward skip, left-to-right: out the source's right-side fan, jog
 * on its own band's bus column, then straight along the target's entry row
 * into its left side — merging with the forward arrivals' head. Only used
 * when that row crosses no intermediate box; the bottom lane is the fallback.
 */
function routeSkipLr(canvas: Canvas, from: Placed, to: Placed, edge: Edge, bus: number): void {
  const ry = from.cy
  const ty = to.cy
  const rx = from.x + from.w - 1
  const headCol = to.x - 1

  if (edge.headFrom === 'none') canvas.junction(rx, ry, R)
  canvas.segH(ry, edge.headFrom === 'none' ? rx : rx + 1, bus)
  if (ry !== ty) canvas.segV(bus, ry, ty)
  canvas.segH(ty, bus, headCol)

  if (edge.headTo === 'none') canvas.addBits(headCol, ty, R)
  else canvas.set(headCol, ty, headGlyph(edge.headTo, '▶'), 'edge')
  if (edge.headFrom !== 'none') canvas.set(rx + 1, ry, headGlyph(edge.headFrom, '◄'), 'edge')

  // Label after the bus jog, where forward labels sit — the gap before the
  // target belongs to the arrivals that end there.
  const text = edgeText(edge)
  if (text !== null) placeLabel(canvas, text, sat(ty, 1), bus + 1)
}

/** A lane label waiting for every route to land before claiming its spot. */
interface LaneLabel {
  text: string
  y: number
  lo: number
  hi: number
}

/** Skip or back edge, left-to-right: down out the bottom, along a lane, back up. */
function routeBackLr(
  canvas: Canvas,
  from: Placed,
  to: Placed,
  edge: Edge,
  laneY: number,
  laneLabels: LaneLabel[],
): void {
  const sx = from.cx
  const sy = from.y + from.h - 1
  const tx = to.cx
  const ty = to.y + to.h - 1

  if (edge.headFrom === 'none') canvas.junction(sx, sy, D)
  canvas.segV(sx, edge.headFrom === 'none' ? sy : sy + 1, laneY)
  canvas.segH(laneY, sx, tx)
  canvas.segV(tx, laneY, ty + 1)

  if (edge.headTo === 'none') canvas.addBits(tx, ty + 1, D)
  else canvas.set(tx, ty + 1, headGlyph(edge.headTo, '▲'), 'edge')
  if (edge.headFrom !== 'none') canvas.set(sx, sy + 1, headGlyph(edge.headFrom, '▲'), 'edge')

  // The label interrupts its own lane row — the row above belongs to the
  // neighbouring lane once several stack. Deferred until all edges landed,
  // so it can dodge the verticals that cross this row.
  const backText = edgeText(edge)
  if (backText !== null) {
    laneLabels.push({
      text: ` ${fitLabel(backText, MAX_LABEL)} `,
      y: laneY,
      lo: Math.min(sx, tx),
      hi: Math.max(sx, tx),
    })
  }
}

/**
 * Write each lane label onto its own row, centred on the run but slid to
 * the nearest stretch free of crossing verticals, arrowheads and earlier
 * labels — clearing a crossing line under a label would sever it.
 */
function placeLaneLabels(canvas: Canvas, labels: LaneLabel[]): void {
  for (const { text, y, lo, hi } of labels) {
    const tw = stringWidth(text)
    const lastStart = hi - 1 - tw
    if (lastStart < lo + 1 || y >= canvas.h) continue
    const clear = (start: number): boolean => {
      for (let x = start; x < start + tw; x++) {
        const i = canvas.idx(x, y)
        if (canvas.occupied[i] === 1) return false
        if ((canvas.mask[i] & (U | D)) !== 0) return false
        if (canvas.ch[i] !== ' ') return false
      }
      return true
    }
    const mid = Math.min(Math.max(half(lo + hi) - half(tw), lo + 1), lastStart)
    let at = mid
    for (let d = 0; ; d++) {
      const left = mid - d
      const right = mid + d
      if (left < lo + 1 && right > lastStart) break
      if (left >= lo + 1 && clear(left)) {
        at = left
        break
      }
      if (right <= lastStart && clear(right)) {
        at = right
        break
      }
    }
    drawTextOverEdges(canvas, text, at, y, 'edgeLabel')
  }
}

/** Free columns at `row` walking from `x` in `dir`, before the first blocked cell. */
function freeRun(canvas: Canvas, row: number, x: number, dir: 1 | -1): number {
  if (row >= canvas.h) return 0
  let n = 0
  for (let cx = x; cx >= 0 && cx < canvas.w; cx += dir) {
    const i = canvas.idx(cx, row)
    if (canvas.ch[i] !== ' ' || canvas.mask[i] !== 0 || canvas.occupied[i]) break
    n++
  }
  return n
}

/**
 * Place an arrival label right of its arrowhead at `x`, flipping left when
 * the right would truncate it and the left fits it whole. When neither side
 * fits, the roomier side gets an ellipsised prefix — a silently clipped
 * label can lie (`recreate…` shown as `r`).
 */
function placeLabelSided(canvas: Canvas, label: string, row: number, x: number): void {
  const tw = stringWidth(fitLabel(label, MAX_LABEL))
  const right = freeRun(canvas, row, x + 1, 1)
  if (right >= tw) {
    placeLabel(canvas, label, row, x + 1)
    return
  }
  const left = Math.min(freeRun(canvas, row, x - 1, -1), x)
  if (left >= tw) {
    placeLabel(canvas, label, row, x - tw)
    return
  }
  if (left > right && left >= 4) {
    const text = fitLabel(label, left)
    placeLabel(canvas, text, row, x - stringWidth(text))
  } else {
    placeLabel(canvas, fitLabel(label, right), row, x + 1)
  }
}

/** Write an edge label, stopping at the first cell already occupied. */
function placeLabel(canvas: Canvas, label: string, row: number, startX: number): void {
  if (row >= canvas.h) return
  const text = fitLabel(label, MAX_LABEL)
  let x = startX
  for (const [c, cw] of measured(text)) {
    if (cw === 0) continue
    if (x + cw > canvas.w) break
    let blocked = false
    for (let k = 0; k < cw; k++) {
      const i = canvas.idx(x + k, row)
      if (canvas.ch[i] !== ' ' || canvas.mask[i] !== 0 || canvas.occupied[i]) blocked = true
    }
    if (blocked) break
    canvas.set(x, row, c, 'edgeLabel')
    for (let k = 1; k < cw; k++) canvas.set(x + k, row, CONT, 'edgeLabel')
    x += cw
  }
}
