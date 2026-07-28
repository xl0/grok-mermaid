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

test('controls and combining marks are zero columns per code point', () => {
  expect(codePointWidth(0x00)).toBe(0) // NUL, the CONT sentinel
  expect(codePointWidth(0x1b)).toBe(0) // ESC
  expect(codePointWidth(0x09)).toBe(0) // tab
  expect(codePointWidth(0x0301)).toBe(0) // combining acute
  expect(codePointWidth(0x200b)).toBe(0) // zero width space
  expect(codePointWidth(0x00ad)).toBe(0) // soft hyphen
  expect(stringWidth(`e${String.fromCodePoint(0x0301)}`)).toBe(1)
})

test('a control character costs one column inside a string', () => {
  // unicode-width splits these: UnicodeWidthChar gives None (folded to 0),
  // UnicodeWidthStr charges one column. Upstream depends on both.
  expect(stringWidth('\t')).toBe(1)
  expect(stringWidth('a\tb')).toBe(3)
  expect(stringWidth('\t ~T~ -')).toBe(7)
  // Combining marks stay zero at the string level.
  expect(stringWidth(String.fromCodePoint(0x00ad))).toBe(0)
  expect(stringWidth(String.fromCodePoint(0x200b))).toBe(0)
})

// Expected values probed directly from the unicode-width crate; see
// tools/differential. Emoji sequences collapse into one 2-column cluster.
const CLUSTERS: [string, string, number][] = [
  ['man', '\u{1F468}', 2],
  ['trailing zwj', '\u{1F468}\u{200D}', 2],
  ['man zwj woman', '\u{1F468}\u{200D}\u{1F469}', 2],
  ['family of three', '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}', 2],
  ['family of four', '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}\u{200D}\u{1F466}', 2],
  ['leading zwj', '\u{200D}\u{1F469}', 2],
  ['woman technologist', '\u{1F469}\u{200D}\u{1F4BB}', 2],
  ['zwj between letters', 'a\u{200D}b', 2],
  ['emoji zwj letter', '\u{1F468}\u{200D}a', 3],
  ['letter zwj emoji', 'a\u{200D}\u{1F468}', 3],
  ['flag', '\u{1F1EC}\u{1F1E7}', 2],
  ['flag plus odd indicator', '\u{1F1EC}\u{1F1E7}\u{1F1EC}', 3],
  ['text heart', '\u{2764}', 1],
  ['emoji heart', '\u{2764}\u{FE0F}', 2],
  ['keycap', '1\u{FE0F}\u{20E3}', 2],
  ['keycap without base', '\u{FE0F}\u{20E3}', 0],
  ['hangul syllable', '\u{1100}\u{1161}', 2],
  ['skin tone', '\u{1F44D}\u{1F3FD}', 2],
  ['two families', '\u{1F468}\u{200D}\u{1F469}\u{1F468}\u{200D}\u{1F469}', 4],
  ['cjk joined by zwj', '\u{65E5}\u{200D}\u{672C}', 4],
]

test('emoji presentation sequences measure as one cluster', () => {
  for (const [name, s, want] of CLUSTERS) {
    expect(`${name}=${stringWidth(s)}`).toBe(`${name}=${want}`)
  }
})
