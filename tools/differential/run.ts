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

const { render } = await import('../../src/index.ts')

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

let same = 0
const diffs: { i: number; width: string; src: string; want: string; got: string }[] = []
corpus.forEach((line, i) => {
  const tab = line.indexOf('\t')
  const width = line.slice(0, tab)
  const src = unesc(line.slice(tab + 1))
  const art = render(src, width === 'none' ? {} : { maxWidth: Number(width) })
  const got = art === null ? '#NONE' : esc(art.plain.join('\n'))
  if (got === golden[i]) same++
  else diffs.push({ i, width, src, want: golden[i], got })
})

console.log(`\ncases: ${corpus.length}  identical: ${same}  differing: ${diffs.length}`)
for (const d of diffs.slice(0, 5)) {
  console.log(`\n===== case ${d.i} (maxWidth=${d.width})\n--- source:\n${d.src}`)
  console.log(`--- rust:\n${unesc(d.want)}`)
  console.log(`--- ours:\n${d.got === '#NONE' ? '#NONE' : unesc(d.got)}`)
}
if (diffs.length > 5) console.log(`\n... and ${diffs.length - 5} more`)
process.exit(diffs.length === 0 ? 0 : 1)
