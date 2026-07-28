import { expect, test } from 'bun:test'
import { codePointWidth, stringWidth } from '../src/width.ts'

const w = (s: string) => codePointWidth(s.codePointAt(0) as number)

test('ascii and box drawing are one column', () => {
  expect(stringWidth('abc')).toBe(3)
  expect(w('─')).toBe(1)
  expect(w('┼')).toBe(1)
  expect(w('╭')).toBe(1)
  expect(w('…')).toBe(1)
  // Ambiguous-width glyphs the renderer draws as arrowheads must stay narrow.
  expect(w('▼')).toBe(1)
  expect(w('◄')).toBe(1)
  expect(w('●')).toBe(1)
  expect(w('«')).toBe(1)
})

test('east asian wide and fullwidth are two columns', () => {
  expect(stringWidth('日本語')).toBe(6)
  expect(stringWidth('日本語ab')).toBe(8)
  expect(w('한')).toBe(2)
  expect(w('Ａ')).toBe(2) // fullwidth latin A
  expect(w('🙂')).toBe(2)
})

test('controls and combining marks are zero columns', () => {
  expect(codePointWidth(0x00)).toBe(0) // NUL, the CONT sentinel
  expect(codePointWidth(0x1b)).toBe(0) // ESC
  expect(codePointWidth(0x0301)).toBe(0) // combining acute
  expect(codePointWidth(0x200b)).toBe(0) // zero width space
  expect(codePointWidth(0x00ad)).toBe(1) // soft hyphen occupies a column
  expect(stringWidth(`e${String.fromCodePoint(0x0301)}`)).toBe(1)
})
