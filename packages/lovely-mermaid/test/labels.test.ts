import { expect, test } from 'bun:test'
import {
  decodeHtmlEntities,
  LABEL_BREAK_CHARS,
  MAX_LINES,
  WRAP_WIDTH,
  wrapLabel,
} from '../src/labels.ts'

const endsWithBreakChar = (s: string): boolean => LABEL_BREAK_CHARS.some((c) => s.endsWith(c))

test('decodeHtmlEntities covers named, numeric and double escapes', () => {
  expect(decodeHtmlEntities('&lt;a&gt; &amp; &quot;x&quot; &apos;y&apos;')).toBe(`<a> & "x" 'y'`)
  expect(decodeHtmlEntities('it&#39;s &#60;ok&#62;')).toBe("it's <ok>")
  expect(decodeHtmlEntities('&#x3c;tag&#X3E; &#x27;q&#x27;')).toBe(`<tag> 'q'`)
  // `&amp;lt;` must yield the literal `&lt;`, never `<`.
  expect(decodeHtmlEntities('&amp;lt;')).toBe('&lt;')
  expect(decodeHtmlEntities('a &foo; b & c')).toBe('a &foo; b & c')
  // Control chars never decode: NUL collides with CONT, ESC injects ANSI.
  expect(decodeHtmlEntities('a&#27;b&#0;c')).toBe('a&#27;b&#0;c')
  expect(decodeHtmlEntities('x&#x1b;y')).toBe('x&#x1b;y')
})

test('wrapLabel breaks a long identifier on a boundary', () => {
  const out = wrapLabel('mark_filter_restore_context', WRAP_WIDTH, MAX_LINES)
  expect(out[0].endsWith('_')).toBe(true)
  for (const line of out.slice(0, -1)) expect(endsWithBreakChar(line)).toBe(true)
  // Nothing is lost: the wrapped lines reconstruct the original word.
  expect(out.join('')).toBe('mark_filter_restore_context')
})

test('wrapLabel falls back to a per-character break without a boundary', () => {
  const token = 'a'.repeat(40)
  const out = wrapLabel(token, WRAP_WIDTH, MAX_LINES)
  expect(out.length).toBeGreaterThanOrEqual(2)
  // 40 narrow chars fit within MAX_LINES, so nothing is truncated or lost.
  expect(out.join('')).toBe(token)
})

test('wrapLabel takes the boundary first, then breaks per character', () => {
  const token = `ab_${'c'.repeat(40)}`
  const out = wrapLabel(token, WRAP_WIDTH, MAX_LINES)
  expect(out[0].endsWith('_')).toBe(true)
  expect(out.slice(1).some((l) => !endsWithBreakChar(l))).toBe(true)
  // 43 columns < MAX_LINES * WRAP_WIDTH, so it must not truncate.
  expect(out.join('')).toBe(token)
})

test('wrapLabel still truncates at maxLines when breaking on boundaries', () => {
  const id = Array(20).fill('segment').join('_')
  const out = wrapLabel(id, WRAP_WIDTH, MAX_LINES)
  expect(out.length).toBe(MAX_LINES)
  expect(out[out.length - 1].endsWith('…')).toBe(true)
})
