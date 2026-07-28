import { expect, test } from 'bun:test'
import { clusterWidth, stringWidth } from '../src/width.ts'

test('ascii and box drawing are one column', () => {
  expect(stringWidth('abc')).toBe(3)
  for (const c of ['─', '┼', '╭', '…', '▼', '◄', '●', '«']) expect(clusterWidth(c)).toBe(1)
})

test('east asian wide and fullwidth are two columns', () => {
  expect(stringWidth('日本語')).toBe(6)
  expect(stringWidth('日本語ab')).toBe(8)
  expect(clusterWidth('한')).toBe(2)
  expect(clusterWidth('Ａ')).toBe(2) // fullwidth latin A
})

test('combining marks fold into their base', () => {
  expect(stringWidth(`e${String.fromCodePoint(0x0301)}`)).toBe(1) // e + acute is one cluster
  expect(stringWidth('abc')).toBe(3)
})

test('zero-width characters occupy nothing', () => {
  // Callers skip painting these rather than reserving a cell for them, so
  // measuring and drawing agree.
  expect(stringWidth(String.fromCodePoint(0x00ad))).toBe(0) // soft hyphen
  expect(stringWidth(String.fromCodePoint(0x200b))).toBe(0) // zero width space
  expect(stringWidth(String.fromCodePoint(0x0301))).toBe(0) // lone combining mark
  expect(stringWidth(`a${String.fromCodePoint(0x00ad)}b`)).toBe(2)
})

test('a control character claims one column', () => {
  expect(stringWidth('\t')).toBe(1)
  expect(stringWidth('a\tb')).toBe(3)
})

// One grapheme cluster is one unit of both measuring and painting, so these
// widths are also what the renderer advances by when drawing.
const CLUSTERS: [string, string, number][] = [
  ['smiley', '\u{1F642}', 2],
  ['man', '\u{1F468}', 2],
  ['man zwj woman', '\u{1F468}\u{200D}\u{1F469}', 2],
  ['family of three', '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}', 2],
  ['family of four', '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}\u{200D}\u{1F466}', 2],
  ['woman technologist', '\u{1F469}\u{200D}\u{1F4BB}', 2],
  ['skin tone', '\u{1F44D}\u{1F3FD}', 2],
  ['text heart', '\u{2764}', 1],
  ['emoji heart', '\u{2764}\u{FE0F}', 2],
  ['warning sign', '\u{26A0}\u{FE0F}', 2],
  ['keycap', '1\u{FE0F}\u{20E3}', 2],
  ['flag', '\u{1F1EC}\u{1F1E7}', 2],
  ['hangul syllable', '\u{1100}\u{1161}', 2],
]

test('an emoji sequence measures as one cluster', () => {
  for (const [name, s, want] of CLUSTERS) {
    expect(`${name}=${clusterWidth(s)}`).toBe(`${name}=${want}`)
  }
})

test('adjacent clusters sum', () => {
  const family = '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}'
  expect(stringWidth(family)).toBe(2)
  expect(stringWidth(family + family)).toBe(4)
  expect(stringWidth(`${family} ok`)).toBe(5)
  expect(stringWidth('\u{1F1EC}\u{1F1E7}\u{1F1EC}')).toBe(3) // flag plus a lone indicator
})
