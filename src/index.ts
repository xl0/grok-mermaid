import { fallback } from './fallback.ts'
import { type CanvasResult, layoutClass, layoutFlowchart, layoutGrouped } from './layout.ts'
import { layoutSequence } from './layout-seq.ts'
import { parseClass, parseEr, parseGraph, parseSequence, parseState } from './parse.ts'
import type { MermaidArt, RenderOptions } from './types.ts'

export { type AnsiTheme, DEFAULT_THEME, toAnsi } from './ansi.ts'
export type { Cls, MermaidArt, RenderOptions, Span } from './types.ts'

/**
 * Render a Mermaid source block as Unicode box-drawing art, or `null` for
 * blank input.
 *
 * Supported: `graph`/`flowchart` (including `subgraph`), `stateDiagram`,
 * `classDiagram`, `erDiagram` and `sequenceDiagram`. Any other diagram type —
 * or one too wide for `maxWidth` — falls back to the source in a framed box.
 */
export function render(src: string, options: RenderOptions = {}): MermaidArt | null {
  if (src.trim() === '') return null
  const { maxWidth } = options

  const outcome = attempt(src, maxWidth)
  if (outcome?.ok) return outcome.canvas.toLines()
  // Only a width failure earns the advisory note; an unsupported diagram type
  // and an over-large one are not the reader's viewport problem.
  return fallback(src, maxWidth, outcome?.oversize === 'width')
}

/** Try each diagram grammar in turn; `null` means none of them matched. */
function attempt(src: string, maxWidth: number | undefined): CanvasResult | null {
  const graph = parseGraph(src)
  if (graph !== null) {
    return graph.groups.length === 0
      ? layoutFlowchart(graph, maxWidth)
      : layoutGrouped(graph, maxWidth)
  }

  const state = parseState(src)
  if (state !== null) return layoutFlowchart(state, maxWidth)

  const cls = parseClass(src)
  if (cls !== null) return layoutClass(cls.graph, cls.infos, maxWidth)

  const er = parseEr(src)
  if (er !== null) return layoutClass(er.graph, er.infos, maxWidth)

  const seq = parseSequence(src)
  if (seq !== null) return layoutSequence(seq, maxWidth)

  return null
}
