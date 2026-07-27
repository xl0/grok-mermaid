/**
 * Semantic class of a run of cells. The renderer never knows about colour;
 * consumers map these to their own theme (see `toAnsi` for the common case).
 *
 * - `border`     box outlines and frames
 * - `text`       node / participant / compartment labels
 * - `edge`       connector lines and arrowheads
 * - `edgeLabel`  text sitting on an edge
 * - `title`      the `mermaid: <kind>` header of a fallback box
 * - `hint`       the advisory note under a too-wide fallback box
 * - `none`       blank filler
 */
export type Cls = 'border' | 'text' | 'edge' | 'edgeLabel' | 'title' | 'hint' | 'none'

/** A run of adjacent cells sharing one semantic class. */
export interface Span {
  text: string
  cls: Cls
}

/**
 * A rendered diagram. `plain[i]` and `styled[i]` describe the same row:
 * `plain` is right-trimmed for display width and copy/paste, `styled` keeps
 * the run structure needed to colour it.
 */
export interface MermaidArt {
  plain: string[]
  styled: Span[][]
}

export interface RenderOptions {
  /**
   * Display columns available. A diagram wider than this is replaced by a
   * framed copy of its source plus an advisory note. Unbounded when omitted.
   */
  maxWidth?: number
}
