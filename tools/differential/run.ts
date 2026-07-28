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

const { render, sourceBox } = await import('../../src/index.ts')
const { measured, stringWidth } = await import('../../src/width.ts')

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
function fitsOnlyHere(src: string, maxWidth: number | undefined, want: string): boolean {
  // Upstream printed a source box; we drew art that fits. Matching on the box
  // title rather than the note, which wraps and so is not contiguous at small
  // widths. Art on both sides that merely differs stays a regression.
  if (maxWidth === undefined || !want.includes('mermaid: ')) return false
  const art = render(src)
  return art !== null && art.width <= maxWidth
}

let same = 0
const expected: number[] = []
const slack: number[] = []
const regressions: { i: number; width: string; src: string; want: string; got: string }[] = []
corpus.forEach((line, i) => {
  const tab = line.indexOf('\t')
  const width = line.slice(0, tab)
  const maxWidth = width === 'none' ? undefined : Number(width)
  const src = unesc(line.slice(tab + 1))
  const art = renderBounded(src, maxWidth)
  const got = art === null ? '#NONE' : esc(art.plain.join('\n'))
  if (got === golden[i]) same++
  else if (expectedToDiffer(src)) expected.push(i)
  else if (fitsOnlyHere(src, maxWidth, golden[i])) slack.push(i)
  else regressions.push({ i, width, src, want: golden[i], got })
})

console.log(`\ncases:       ${corpus.length}`)
console.log(`identical:   ${same}`)
console.log(`expected:    ${expected.length}  (grapheme clustering — see CODE.md)`)
console.log(`slack:       ${slack.length}  (painted vs allocated width — see CODE.md)`)
console.log(`regressions: ${regressions.length}`)

for (const d of regressions.slice(0, 5)) {
  console.log(`\n===== case ${d.i} (maxWidth=${d.width})\n--- source:\n${d.src}`)
  console.log(`--- rust:\n${unesc(d.want)}`)
  console.log(`--- ours:\n${d.got === '#NONE' ? '#NONE' : unesc(d.got)}`)
}
if (regressions.length > 5) console.log(`\n... and ${regressions.length - 5} more`)
process.exit(regressions.length === 0 ? 0 : 1)
