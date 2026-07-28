import { stripControls } from './labels.ts'
import { type CanvasResult, layoutClass, layoutFlowchart, layoutGrouped } from './layout.ts'
import { layoutSequence } from './layout-seq.ts'
import { parseClass, parseEr, parseGraph, parseSequence, parseState } from './parse.ts'
import type { MermaidArt } from './types.ts'

export { type AnsiTheme, DEFAULT_THEME, toAnsi } from './ansi.ts'
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
 * `null` means there is no art to show: blank input, a diagram type this
 * renderer does not draw, or one large enough that laying it out is refused.
 */
export function render(src: string): MermaidArt | null {
  src = stripControls(src)
  if (src.trim() === '') return null
  return attempt(src)?.toLines() ?? null
}

/** Try each diagram grammar in turn; `null` means none of them drew anything. */
function attempt(src: string): CanvasResult {
  const graph = parseGraph(src)
  if (graph !== null) {
    return graph.groups.length === 0 ? layoutFlowchart(graph) : layoutGrouped(graph)
  }

  const state = parseState(src)
  if (state !== null) return layoutFlowchart(state)

  const cls = parseClass(src)
  if (cls !== null) return layoutClass(cls.graph, cls.infos)

  const er = parseEr(src)
  if (er !== null) return layoutClass(er.graph, er.infos)

  const seq = parseSequence(src)
  if (seq !== null) return layoutSequence(seq)

  return null
}
