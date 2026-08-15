import { expect, test } from 'bun:test'
import { render, sourceBox } from '../src/index.ts'
import { stringWidth } from '../src/width.ts'
import { corpusSources } from './corpus.ts'

// The corpus sweep: every source — sensible, hostile or fuzz — must render
// without throwing and uphold the public invariants. Golden files pin what
// output looks like; this pins that there is always an output to pin.

test('every corpus source renders under the public invariants', () => {
  for (const src of corpusSources()) {
    let art: ReturnType<typeof render>
    try {
      art = render(src)
    } catch (e) {
      throw new Error(`render threw on ${JSON.stringify(src)}: ${e}`)
    }
    if (art === null) continue
    for (let i = 0; i < art.plain.length; i++) {
      const joined = art.styled[i].map((s) => s.text).join('')
      if (joined !== art.plain[i]) {
        throw new Error(`styled desyncs from plain on ${JSON.stringify(src)} row ${i}`)
      }
    }
    const widest = Math.max(0, ...art.plain.map(stringWidth))
    if (art.width !== widest) {
      throw new Error(`width ${art.width} != widest row ${widest} on ${JSON.stringify(src)}`)
    }
  }
  expect(true).toBe(true)
})

test('every corpus source frames in a source box without throwing', () => {
  for (const src of corpusSources()) {
    for (const w of [1, 20, 80]) {
      const box = sourceBox(src, w)
      expect(box.plain.length).toBeGreaterThan(0)
    }
  }
})
