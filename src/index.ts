import type { MermaidArt, RenderOptions } from './types.ts'

export type { Cls, MermaidArt, RenderOptions, Span } from './types.ts'

/**
 * Render a Mermaid source block as Unicode box-drawing art, or `null` for
 * blank input.
 *
 * Supported: `graph`/`flowchart` (incl. `subgraph`), `stateDiagram`,
 * `classDiagram`, `erDiagram`, `sequenceDiagram`. Anything else — or a diagram
 * too wide for `maxWidth` — falls back to the source in a framed box.
 */
export function render(src: string, options: RenderOptions = {}): MermaidArt | null {
  if (src.trim() === '') return null
  void options
  throw new Error('not implemented')
}
