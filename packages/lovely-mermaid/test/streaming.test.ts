import { expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { render } from '../src/index.ts'
import { stringWidth } from '../src/width.ts'

// The streaming sweep: a TUI feeds render() every prefix of a source as it
// arrives, so every prefix of every golden case must render without throwing
// and uphold the public invariants. Warnings are expected mid-stream; crashes
// and contract breaks are not.

function goldenSources(): string[] {
  const out: string[] = []
  const root = `${import.meta.dir}/cases`
  for (const dir of readdirSync(root, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    for (const file of readdirSync(`${root}/${dir.name}`)) {
      const md = readFileSync(`${root}/${dir.name}/${file}`, 'utf8')
      for (const m of md.matchAll(/```mermaid\n([\s\S]*?)```/g)) out.push(m[1])
    }
  }
  return out
}

test('every prefix of every golden source renders under the public invariants', () => {
  const sources = goldenSources()
  expect(sources.length).toBeGreaterThan(100)
  for (const src of sources) {
    const cps = [...src]
    for (let end = 1; end <= cps.length; end++) {
      const prefix = cps.slice(0, end).join('')
      let art: ReturnType<typeof render>
      try {
        art = render(prefix)
      } catch (e) {
        throw new Error(`render threw on prefix ${JSON.stringify(prefix)}: ${e}`)
      }
      if (art === null) continue
      for (let i = 0; i < art.plain.length; i++) {
        const joined = art.styled[i].map((s) => s.text).join('')
        if (joined !== art.plain[i]) {
          throw new Error(`styled desyncs from plain on prefix ${JSON.stringify(prefix)} row ${i}`)
        }
      }
      const widest = Math.max(0, ...art.plain.map(stringWidth))
      if (art.width !== widest) {
        throw new Error(`width ${art.width} != widest row ${widest} on ${JSON.stringify(prefix)}`)
      }
    }
  }
})
