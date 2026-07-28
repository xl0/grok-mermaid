/**
 * Regenerates `docs/demo.svg` — the README's colour example.
 *
 *   bun run gen:demo
 *
 * A code fence already shows the art; what it cannot show is the semantic
 * classes, which is the whole point of `styled`. So this paints real `render()`
 * output through a theme, and is generated rather than hand-drawn so it cannot
 * drift from what the library actually emits.
 *
 * The panel carries its own background: an SVG in a README is loaded as an
 * `<img>`, where `prefers-color-scheme` follows the OS rather than GitHub's
 * theme toggle, so a self-contained dark panel is the one thing that reads
 * correctly under both.
 */

import { render } from '../src/index.ts'
import type { Cls } from '../src/types.ts'
import { clusterWidth, measured } from '../src/width.ts'

const SRC = `flowchart TD
  A[Parse source] -->|ok| B[Lay out]
  A -->|unsupported| C[Framed source]
  B --> D[Unicode art]
  C --> D`

/** Terminal-ish palette. Deliberately not GitHub's — this is a demo of a theme. */
const FILL: Record<Cls, string | null> = {
  border: '#6e7681',
  text: '#e6edf3',
  edge: '#39c5cf',
  edgeLabel: '#9198a1',
  title: '#e6edf3',
  hint: '#9198a1',
  none: null,
}

const FONT =
  "ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace"
const FONT_SIZE = 14
const CHAR_W = 8.4
/**
 * One em, so box-drawing glyphs always tile.
 *
 * `│` spans at least a full em in every monospace font worth naming, so a line
 * height at or below the em makes adjacent rows overlap invisibly. Anything
 * taller leaves a gap at every row boundary and the boxes read as broken — at
 * 20 they visibly fall apart. Erring short is the only font-independent choice,
 * since the SVG renders in the *viewer's* font, not one we ship.
 */
const LINE_H = FONT_SIZE
const PAD = 18

const esc = (s: string): string =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const art = render(SRC)
if (art === null) throw new Error('demo source rendered blank')

const cols = Math.max(...art.plain.map((l) => [...measured(l)].reduce((w, [, cw]) => w + cw, 0)))
const width = cols * CHAR_W + 2 * PAD
const height = art.plain.length * LINE_H + 2 * PAD

const rows: string[] = []
art.styled.forEach((spans, row) => {
  const y = PAD + row * LINE_H + FONT_SIZE
  let col = 0
  for (const span of spans) {
    const fill = FILL[span.cls]
    const xs: number[] = []
    for (const [cluster, cw] of measured(span.text)) {
      // One x per UTF-16 unit, so the glyph grid survives any font's metrics.
      if (cluster.length !== 1 || clusterWidth(cluster) !== 1) {
        throw new Error(`demo source must stay single-width BMP, got ${JSON.stringify(cluster)}`)
      }
      xs.push(PAD + col * CHAR_W)
      col += cw
    }
    if (fill === null || span.text.trim() === '') continue
    rows.push(
      `  <text x="${xs.map((n) => n.toFixed(1)).join(' ')}" y="${y}" fill="${fill}">${esc(span.text)}</text>`,
    )
  }
})

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(0)}" height="${height.toFixed(0)}" viewBox="0 0 ${width.toFixed(0)} ${height.toFixed(0)}" role="img" aria-label="A flowchart rendered as Unicode box-drawing art, with box outlines, labels and connectors each in their own colour">
  <title>grok-mermaid output, coloured by semantic class</title>
  <rect width="100%" height="100%" rx="8" fill="#0d1117"/>
  <g font-family="${FONT}" font-size="${FONT_SIZE}" xml:space="preserve">
${rows.join('\n')}
  </g>
</svg>
`

await Bun.write(new URL('../docs/demo.svg', import.meta.url), svg)
console.log(`wrote docs/demo.svg (${cols}x${art.plain.length} cells, ${rows.length} runs)`)
