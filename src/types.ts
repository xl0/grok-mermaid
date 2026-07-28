/**
 * Semantic class of a run of cells. The renderer never knows about colour;
 * consumers map these to their own theme (see `toAnsi` for the common case).
 *
 * - `border`     box outlines, subgraph frames, compartment rules
 * - `text`       node / participant / compartment labels
 * - `edge`       connector lines and arrowheads
 * - `edgeLabel`  text sitting on an edge
 * - `title`      the `mermaid: <kind>` header of a source box
 * - `none`       blank filler
 */
export type Cls = 'border' | 'text' | 'edge' | 'edgeLabel' | 'title' | 'none'

/** A run of adjacent cells sharing one semantic class. */
export interface Span {
  text: string
  cls: Cls
}

/**
 * A rendered diagram. `plain[i]` and `styled[i]` describe the same row:
 * `plain` is right-trimmed for display width and copy/paste, `styled` keeps
 * the run structure needed to colour it.
 *
 * `width` is the display columns the widest row needs — the number to compare
 * against the space you have. It cannot be recovered from `plain`, whose rows
 * are strings of code points, not columns.
 */
export interface MermaidArt {
  plain: string[]
  styled: Span[][]
  width: number
}
