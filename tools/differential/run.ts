/**
 * Differential test: renders a corpus through both the Rust original and this
 * port, and reports any case where the plain output differs.
 *
 *   bun run differential
 *
 * Needs a Rust toolchain and a grok-build checkout. The upstream renderer is
 * copied in at run time rather than vendored, so this repo carries no copy of
 * it; point GROK_BUILD at the checkout if it is not in the default location.
 */

import { existsSync } from 'node:fs'
import { copyFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const here = new URL('.', import.meta.url).pathname
const checkout =
  process.env.GROK_BUILD ?? join(homedir(), '.cache/checkouts/github.com/xai-org/grok-build')
const upstream = join(checkout, 'crates/codegen/xai-grok-markdown/src/mermaid.rs')

if (!existsSync(upstream)) {
  console.error(`no upstream renderer at ${upstream}`)
  console.error('clone https://github.com/xai-org/grok-build and set GROK_BUILD to it')
  process.exit(1)
}
await copyFile(upstream, join(here, 'src/mermaid.rs'))

const run = async (cmd: string[], cwd: string, stdin?: string) => {
  const proc = Bun.spawn(cmd, {
    cwd,
    stdin: stdin === undefined ? 'ignore' : new TextEncoder().encode(stdin),
    stdout: 'pipe',
    stderr: 'inherit',
  })
  const out = await new Response(proc.stdout).text()
  if ((await proc.exited) !== 0) throw new Error(`${cmd.join(' ')} failed`)
  return out
}

console.log('building harness against upstream mermaid.rs ...')
await run(['cargo', 'build', '--release', '-q'], here)

console.log('generating corpus ...')
await run(['bun', 'run', join(here, 'corpus.ts')], here)
const corpus = (await Bun.file(join(here, 'corpus.txt')).text()).split('\n').filter((l) => l !== '')

console.log(`running ${corpus.length} cases through the Rust original ...`)
const golden = (
  await run([join(here, 'target/release/differential')], here, `${corpus.join('\n')}\n`)
).split('\n')

const { diagramKind, render, sourceBox } = await import(
  '../../packages/lovely-mermaid/src/index.ts'
)
const { measured, stringWidth } = await import('../../packages/lovely-mermaid/src/width.ts')
const { parseGraph } = await import('../../packages/lovely-mermaid/src/diagrams/flowchart.ts')
const { parseState } = await import('../../packages/lovely-mermaid/src/diagrams/state.ts')
const { computeRanks } = await import('../../packages/lovely-mermaid/src/layout.ts')

const TOO_WIDE_HINT =
  'This diagram is too wide to display here — open the image to view it in full.'

/**
 * Reproduce upstream's `render(src, max_width)`, which the port no longer has.
 *
 * The port renders at natural size and reports `width`, leaving the response to
 * the caller; upstream folds that decision in. This is that decision, spelled
 * out once here so the corpus still compares byte for byte. The word wrapping
 * below is upstream's, and lives here rather than in `src` for the same reason.
 */
function renderBounded(src: string, maxWidth: number | undefined): { plain: string[] } | null {
  const art = render(src)
  if (art !== null && (maxWidth === undefined || art.width <= maxWidth)) return art
  if (src.trim() === '') return null

  const box = sourceBox(src, maxWidth)
  // Only a width failure earns the note; an unsupported or over-large diagram
  // is not the reader's viewport problem.
  if (art === null) return box
  return { plain: [...box.plain, ...wrapWords(TOO_WIDE_HINT, maxWidth)] }
}

function chunkLine(line: string, limit: number | undefined): string[] {
  if (limit === undefined || stringWidth(line) <= limit) return [line]
  const out: string[] = []
  let cur = ''
  let curW = 0
  for (const [c, cw] of measured(line)) {
    if (curW + cw > limit && cur !== '') {
      out.push(cur)
      cur = ''
      curW = 0
    }
    cur += c
    curW += cw
  }
  if (cur !== '') out.push(cur)
  return out
}

function wrapWords(text: string, limit: number | undefined): string[] {
  if (limit === undefined) return [text]
  const lines: string[] = []
  let cur = ''
  for (const word of text.split(' ').filter((w) => w !== '')) {
    if (cur === '') cur = word
    else if (stringWidth(cur) + 1 + stringWidth(word) <= limit) cur += ` ${word}`
    else {
      lines.push(cur)
      cur = word
    }
  }
  if (cur !== '') lines.push(cur)
  return lines.flatMap((l) => chunkLine(l, limit))
}

const unesc = (s: string): string => {
  let o = ''
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '\\') {
      o += s[i]
      continue
    }
    i++
    o += s[i] === 'n' ? '\n' : s[i] === 'r' ? '\r' : s[i] === 't' ? '\t' : s[i]
  }
  return o
}
const esc = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')

const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })

/**
 * This port deliberately measures and paints in grapheme clusters, which the
 * Rust original does not, so any source containing a multi-code-point cluster
 * or a standalone zero-width character is expected to differ. Anything else
 * differing is a regression.
 */
function expectedToDiffer(src: string): boolean {
  for (const { segment } of segmenter.segment(src)) {
    if ([...segment].length > 1) return true
    if (segment !== '\n' && stringWidth(segment) === 0) return true
  }
  return false
}

/**
 * Upstream measures a diagram by the canvas it allocated; the port measures the
 * cells actually painted. A canvas whose rightmost column stays blank is over
 * `max_width` upstream and within it here, so the port draws the diagram where
 * upstream printed the source. Strictly more art, never less.
 */
/**
 * Upstream fails a state / class / ER / sequence diagram outright on one
 * unreadable statement, and refuses any diagram over a size cap. The port is
 * lenient everywhere: unreadable statements drop with a warning, caps truncate
 * with a warning, and the rest renders. Upstream box + our warned art =
 * deliberate.
 */
function lenientHere(src: string, want: string): boolean {
  if (!want.includes('mermaid: ')) return false
  return (render(src)?.warnings.length ?? 0) > 0
}

/**
 * Upstream matches `stateDiagram`/`classDiagram` headers by prefix, accepting
 * junk like `stateDiagramFoo` that mermaid proper rejects; the port matches
 * exactly. Upstream art + our source box on such a header = deliberate.
 */
function stricterHeaderHere(src: string, want: string): boolean {
  const header =
    src
      .trimStart()
      .split(/[\s;]+/)[0]
      ?.toLowerCase() ?? ''
  const junkHeader =
    (header.startsWith('statediagram') || header.startsWith('classdiagram')) &&
    diagramKind(src) === null
  return junkHeader && !want.includes('mermaid: ')
}

/**
 * Upstream flattens `state X { ... }` composites into siblings; the port
 * draws them as titled frames (and `--` regions as unlabelled ones), so any
 * state diagram with a composite body renders structurally differently.
 */
function compositeHere(src: string, got: string): boolean {
  return got !== '#NONE' && diagramKind(src) === 'state' && src.includes('{')
}

/**
 * The v2 node syntax `id@{shape: ..., label: ...}` is unknown to upstream —
 * it keeps a bare `id` node and drops the rest of the statement. The port
 * parses it, so any flowchart using `@{` renders differently.
 */
function v2ShapeHere(src: string, got: string): boolean {
  return got !== '#NONE' && diagramKind(src) === 'flowchart' && src.includes('@{')
}

/**
 * Upstream strips activation markers (`->>+`, `-->>-`, `activate X`); the
 * port thickens the lifeline over the active range, so any sequence diagram
 * using them renders differently.
 */
function activationsHere(src: string, got: string): boolean {
  if (got === '#NONE' || diagramKind(src) !== 'sequence') return false
  return /(>>|->|-x|--x|-\)|--\))\s*[+-]/.test(src) || /^\s*(de)?activate\b/im.test(src)
}

/**
 * Upstream folds ER and class cardinalities into one mid-edge string; the
 * port paints each at its own end (and shortens `0..*` to `*`), so any such
 * diagram with a relationship renders differently.
 */
function cardsHere(src: string, got: string): boolean {
  if (got === '#NONE') return false
  const kind = diagramKind(src)
  if (kind === 'er') return true
  return kind === 'class' && src.includes('"')
}

/**
 * The port expands tabs in the source box (a literal tab misaligns the frame
 * at the terminal's tab stops); upstream prints them raw. Both sides showing
 * a box for a tab-carrying source = deliberate.
 */
function tabsHere(src: string, got: string): boolean {
  return src.includes('\t') && got.includes('mermaid: ')
}

/**
 * A note left of the first participant used to paint over the lifelines
 * (upstream still does); the port shifts the diagram right to make room.
 */
function noteLeftHere(src: string, got: string): boolean {
  return got !== '#NONE' && diagramKind(src) === 'sequence' && /note\s+left\s+of/i.test(src)
}

/**
 * Upstream draws diamond nodes (`A{...}`, state `<<choice>>`) like round
 * ones; the port draws them with double borders, so any diagram declaring
 * one differs.
 */
function diamondHere(src: string, got: string): boolean {
  if (got === '#NONE') return false
  const kind = diagramKind(src)
  if (kind === 'flowchart' && src.includes('{')) return true
  return kind === 'state' && src.includes('<<choice>>')
}

/**
 * The port orders lane-edge endpoints last within their rank so the corridor
 * to the lane strip is clear (upstream lets the lane cut through whatever
 * sits beyond them), so any diagram with a skip or back edge may differ.
 */
function laneOrderHere(src: string, got: string): boolean {
  if (got === '#NONE') return false
  const kind = diagramKind(src)
  const g = kind === 'flowchart' ? parseGraph(src) : kind === 'state' ? parseState(src) : null
  if (g === null) return false
  const ranks = computeRanks(g)
  return g.edges.some((e) => e.from !== e.to && ranks[e.to] !== ranks[e.from] + 1)
}

/**
 * pie / mindmap / timeline / gitGraph are diagram types upstream never had —
 * it prints the source box, the port draws them.
 */
function newTypeHere(src: string, got: string): boolean {
  if (got === '#NONE') return false
  const kind = diagramKind(src)
  return kind === 'pie' || kind === 'mindmap' || kind === 'timeline' || kind === 'gitgraph'
}

function fitsOnlyHere(src: string, maxWidth: number | undefined, want: string): boolean {
  // Upstream printed a source box; we drew art that fits. Matching on the box
  // title rather than the note, which wraps and so is not contiguous at small
  // widths. Art on both sides that merely differs stays a regression.
  if (maxWidth === undefined || !want.includes('mermaid: ')) return false
  const art = render(src)
  return art !== null && art.width <= maxWidth
}

/** Upstream preserves blank canvas rows outside the painted diagram. */
function trimmedOnlyHere(want: string, got: string): boolean {
  const rows = unesc(want).split('\n')
  let first = 0
  while (first < rows.length && rows[first] === '') first++
  let end = rows.length
  while (end > first && rows[end - 1] === '') end--
  return esc(rows.slice(first, end).join('\n')) === got
}

let same = 0
const expected: number[] = []
const lenient: number[] = []
const composite: number[] = []
const v2shape: number[] = []
const activations: number[] = []
const cards: number[] = []
const header: number[] = []
const slack: number[] = []
const trimmed: number[] = []
const diamond: number[] = []
const tabs: number[] = []
const noteLeft: number[] = []
const laneOrder: number[] = []
const newTypes: number[] = []
const regressions: { i: number; width: string; src: string; want: string; got: string }[] = []
corpus.forEach((line, i) => {
  const tab = line.indexOf('\t')
  const width = line.slice(0, tab)
  const maxWidth = width === 'none' ? undefined : Number(width)
  const src = unesc(line.slice(tab + 1))
  const art = renderBounded(src, maxWidth)
  const got = art === null ? '#NONE' : esc(art.plain.join('\n'))
  if (got === golden[i]) same++
  else if (trimmedOnlyHere(golden[i], got)) trimmed.push(i)
  else if (tabsHere(src, got)) tabs.push(i)
  else if (expectedToDiffer(src)) expected.push(i)
  else if (lenientHere(src, golden[i])) lenient.push(i)
  else if (compositeHere(src, got)) composite.push(i)
  else if (v2ShapeHere(src, got)) v2shape.push(i)
  else if (activationsHere(src, got)) activations.push(i)
  else if (cardsHere(src, got)) cards.push(i)
  else if (diamondHere(src, got)) diamond.push(i)
  else if (noteLeftHere(src, got)) noteLeft.push(i)
  else if (laneOrderHere(src, got)) laneOrder.push(i)
  else if (newTypeHere(src, got)) newTypes.push(i)
  else if (stricterHeaderHere(src, golden[i])) header.push(i)
  else if (fitsOnlyHere(src, maxWidth, golden[i])) slack.push(i)
  else regressions.push({ i, width, src, want: golden[i], got })
})

console.log(`\ncases:       ${corpus.length}`)
console.log(`identical:   ${same}`)
console.log(`expected:    ${expected.length}  (grapheme clustering — see CODE.md)`)
console.log(
  `lenient:     ${lenient.length}  (unreadable statements dropped, caps truncate — see CODE.md)`,
)
console.log(
  `composite:   ${composite.length}  (composite states framed, not flattened — see CODE.md)`,
)
console.log(`v2shape:     ${v2shape.length}  (v2 @{} node syntax parsed — see CODE.md)`)
console.log(
  `activations: ${activations.length}  (sequence activations double lifelines — see CODE.md)`,
)
console.log(`cards:       ${cards.length}  (cardinalities at their own edge ends — see CODE.md)`)
console.log(`diamond:     ${diamond.length}  (diamond nodes get double borders — see CODE.md)`)
console.log(`tabs:        ${tabs.length}  (source box expands tabs — see CODE.md)`)
console.log(`noteLeft:    ${noteLeft.length}  (left-edge notes get their own margin — see CODE.md)`)
console.log(
  `laneOrder:   ${laneOrder.length}  (lane endpoints order last in their rank — see CODE.md)`,
)
console.log(
  `newTypes:    ${newTypes.length}  (pie/mindmap/timeline/gitGraph drawn, upstream boxed — see CODE.md)`,
)
console.log(`header:      ${header.length}  (exact header match — see CODE.md)`)
console.log(`slack:       ${slack.length}  (painted vs allocated width — see CODE.md)`)
console.log(`trimmed:     ${trimmed.length}  (empty outer rows removed — see CODE.md)`)
console.log(`regressions: ${regressions.length}`)

for (const d of regressions.slice(0, 5)) {
  console.log(`\n===== case ${d.i} (maxWidth=${d.width})\n--- source:\n${d.src}`)
  console.log(`--- rust:\n${unesc(d.want)}`)
  console.log(`--- ours:\n${d.got === '#NONE' ? '#NONE' : unesc(d.got)}`)
}
if (regressions.length > 5) console.log(`\n... and ${regressions.length - 5} more`)
process.exit(regressions.length === 0 ? 0 : 1)
