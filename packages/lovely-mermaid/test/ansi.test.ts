import { expect, test } from 'bun:test'
import { render, toAnsi } from '../src/index.ts'

// The ANSI golden: golden markdown fences carry `plain`, which cannot show
// the theme × classDef merge matrix. One snapshot of toAnsi output pins it —
// theme fallback, fill + contrast foreground, stroke on borders, bold-only
// merging with (not replacing) the theme SGR, and OSC 8 around hrefs.

const SRC = `flowchart TD
  A[Styled]:::hot --> B[Plain]
  C[Linked] --> B
  click C "https://example.com"
  classDef hot fill:#ff0000,color:#ffffff
  classDef boldonly font-weight:bold
  B:::boldonly
`

test('toAnsi output is stable across the merge matrix', () => {
  const art = render(SRC)
  if (art === null) throw new Error('render drew nothing')
  // JSON-escaped so the snapshot shows every ESC byte in review.
  expect(toAnsi(art).map((row) => JSON.stringify(row))).toMatchSnapshot()
})
