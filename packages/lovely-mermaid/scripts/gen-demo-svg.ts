/**
 * Regenerates `docs/demo.svg` — the README's colour example.
 *
 *   bun run gen:demo
 *
 * A code fence already shows the art; what it cannot show is the semantic
 * roles, which is the whole point of `styled`. So this pipes real `render()`
 * output through `toAnsi` and lovely-ansi-svg's `exportSvg` — generated, not
 * hand-drawn, so it cannot drift from what the library actually emits.
 *
 * The panel carries its own background: an SVG in a README is loaded as an
 * `<img>`, where `prefers-color-scheme` follows the OS rather than GitHub's
 * theme toggle, so a self-contained dark panel is the one thing that reads
 * correctly under both.
 */

// Until lovely-ansi-svg is on npm this resolves through a manual link
// (`ln -s ../../../../svelte-asciiart/packages/lovely-ansi-svg node_modules/lovely-ansi-svg`);
// once published it becomes a plain devDependency, same import.
import { defaultTheme, exportSvg } from 'lovely-ansi-svg'
import { type AnsiTheme, render, toAnsi } from '../src/index.ts'

const SRC = `flowchart TD
  A[Parse source] -->|ok| B[Lay out]
  A -->|unsupported| C[Framed source]
  B --> D[Unicode art]
  C --> D`

/** Terminal-ish palette. Deliberately not GitHub's — this is a demo of a theme. */
const THEME: AnsiTheme = {
  border: '38;2;110;118;129', // #6e7681
  edge: '38;2;57;197;207', // #39c5cf
  edgeLabel: '38;2;145;152;161', // #9198a1
  title: '1',
}

const FONT =
  "ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace"

const art = render(SRC)
if (art === null) throw new Error('demo source rendered blank')

const svg = exportSvg(toAnsi(art, THEME).join('\n'), {
  cellSize: 14,
  margin: [1, 2],
  fontFamily: FONT,
  background: '#0d1117',
  theme: { ...defaultTheme, foreground: '#e6edf3' },
  extraCss: 'rect:first-of-type { rx: 8px }',
}).replace(
  '<svg ',
  '<svg role="img" aria-label="A flowchart rendered as Unicode box-drawing art, with box outlines, labels and connectors each in their own colour" ',
)

await Bun.write(new URL('../docs/demo.svg', import.meta.url), svg)
console.log(`wrote docs/demo.svg (${art.width}x${art.plain.length} cells)`)
