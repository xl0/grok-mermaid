import { stripControls } from './labels.ts'
import { type CanvasResult, layoutClass, layoutFlowchart, layoutGrouped } from './layout.ts'
import { layoutSequence } from './layout-seq.ts'
import { parseClass, parseEr, parseGraph, parseSequence, parseState } from './parse.ts'
import type { MermaidArt } from './types.ts'

export { type AnsiTheme, DEFAULT_THEME, toAnsi } from './ansi.ts'
export { type DiagramKind, diagramKind } from './parse.ts'
export { sourceBox } from './source-box.ts'
export type { Cls, MermaidArt, Span } from './types.ts'

/**
 * Render a Mermaid source block as Unicode box-drawing art.
 *
 * Supported: `graph`/`flowchart` (including `subgraph`), `stateDiagram`,
 * `classDiagram`, `erDiagram` and `sequenceDiagram`.
 *
 * The diagram is laid out at whatever size it needs; `art.width` reports the
 * columns that turned out to be. Deciding what to do when that exceeds the
 * space at hand is the caller's — `sourceBox` is the usual answer:
 *
 * ```ts
 * const art = render(src)
 * show(art && art.width <= cols ? art : sourceBox(src, cols))
 * ```
 *
 * `null` means there is no art to show: blank input, a syntax error, a diagram
 * type this renderer does not draw, or one large enough that laying it out is
 * refused. `diagramKind` separates the middle two.
 *
 * A flowchart never fails on a syntax error — it keeps what parsed and lists
 * what it dropped in `art.warnings`, so check that before trusting the art.
 */
export function render(src: string): MermaidArt | null {
  src = stripControls(src)
  if (src.trim() === '') return null
  const drawn = attempt(src)
  if (drawn === null) return null
  return { ...drawn.canvas.toLines(), warnings: drawn.warnings }
}

/** Try each diagram grammar in turn; `null` means none of them drew anything. */
function attempt(src: string): { canvas: NonNullable<CanvasResult>; warnings: string[] } | null {
  const plain = (canvas: CanvasResult) => (canvas === null ? null : { canvas, warnings: [] })

  const graph = parseGraph(src)
  if (graph !== null) {
    const canvas = graph.groups.length === 0 ? layoutFlowchart(graph) : layoutGrouped(graph)
    return canvas === null ? null : { canvas, warnings: graph.warnings }
  }

  const state = parseState(src)
  if (state !== null) return plain(layoutFlowchart(state))

  const cls = parseClass(src)
  if (cls !== null) return plain(layoutClass(cls.graph, cls.infos))

  const er = parseEr(src)
  if (er !== null) return plain(layoutClass(er.graph, er.infos))

  const seq = parseSequence(src)
  if (seq !== null) return plain(layoutSequence(seq))

  return null
}
