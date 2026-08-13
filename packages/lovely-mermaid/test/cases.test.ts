import { expect, test } from 'bun:test'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render } from '../src/index.ts'

// Golden-file runner. Each test/cases/<type>/<name>.md holds one or more
// ```mermaid fences, each followed by a ```text fence with the expected
// `render(src).plain` (or a bare `(null)` line for sources that must refuse)
// and an optional ```warnings fence (one warning per line; absent = none).
// `bun run test:update` rewrites the text/warnings fences from actual output.

const CASES = fileURLToPath(new URL('cases/', import.meta.url))
const UPDATE = process.env.UPDATE === '1'

/** A fenced block; start/end delimit its content lines, fence lines excluded. */
type Block = { kind: 'mermaid' | 'text' | 'warnings' | 'null'; start: number; end: number }

function blocksOf(lines: string[], file: string): Block[] {
  const blocks: Block[] = []
  let open: Block | null = null
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (open !== null) {
      if (l === '```') {
        open.end = i
        blocks.push(open)
        open = null
      }
    } else if (l === '```mermaid' || l === '```text' || l === '```warnings') {
      open = { kind: l.slice(3) as Block['kind'], start: i + 1, end: -1 }
    } else if (l.trim() === '(null)') {
      blocks.push({ kind: 'null', start: i, end: i + 1 })
    }
  }
  if (open !== null) throw new Error(`${file}: unclosed \`\`\`${open.kind} fence`)
  return blocks
}

const files = (readdirSync(CASES, { recursive: true }) as string[])
  .filter((f) => f.endsWith('.md'))
  .sort()

for (const file of files) {
  test(file.slice(0, -3), () => {
    const path = join(CASES, file)
    const raw = readFileSync(path, 'utf8')
    const lines = raw.split('\n')
    const blocks = blocksOf(lines, file)
    // Replacements of [start, end) line ranges, applied bottom-up after the pass.
    const edits: { start: number; end: number; rows: string[] }[] = []
    for (let b = 0; b < blocks.length; b++) {
      if (blocks[b].kind !== 'mermaid') continue
      const expected = blocks[b + 1]
      if (expected === undefined || (expected.kind !== 'text' && expected.kind !== 'null'))
        throw new Error(`${file}: mermaid fence needs a \`\`\`text fence or (null) after it`)
      const warns = blocks[b + 2]?.kind === 'warnings' ? blocks[b + 2] : undefined
      const art = render(lines.slice(blocks[b].start, blocks[b].end).join('\n'))
      if (expected.kind === 'null') {
        expect(art).toBeNull()
        continue
      }
      if (art === null)
        throw new Error(`${file}: render refused; replace the text fence with (null)`)
      if (UPDATE) {
        edits.push({ start: expected.start, end: expected.end, rows: art.plain })
        if (warns !== undefined) {
          if (art.warnings.length > 0)
            edits.push({ start: warns.start, end: warns.end, rows: art.warnings })
          else edits.push({ start: warns.start - 1, end: warns.end + 1, rows: [] })
        } else if (art.warnings.length > 0) {
          edits.push({
            start: expected.end + 1,
            end: expected.end + 1,
            rows: ['', '```warnings', ...art.warnings, '```'],
          })
        }
      } else {
        expect(art.plain.join('\n')).toBe(lines.slice(expected.start, expected.end).join('\n'))
        expect(art.warnings).toEqual(warns === undefined ? [] : lines.slice(warns.start, warns.end))
      }
    }
    if (edits.length > 0) {
      edits.sort((a, z) => z.start - a.start)
      for (const e of edits) lines.splice(e.start, e.end - e.start, ...e.rows)
      const next = lines.join('\n')
      if (next !== raw) {
        writeFileSync(path, next)
        console.log(`updated ${file}`)
      }
    }
  })
}
