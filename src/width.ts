import { WIDE, ZERO } from './width-data.ts'

function inRanges(ranges: [number, number][], cp: number): boolean {
  let lo = 0
  let hi = ranges.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const [start, end] = ranges[mid]
    if (cp < start) hi = mid - 1
    else if (cp > end) lo = mid + 1
    else return true
  }
  return false
}

/**
 * Display columns a single code point occupies, matching the `unicode-width`
 * crate: 0 for control characters and combining marks, 2 for East Asian Wide
 * and Fullwidth, 1 otherwise.
 */
export function codePointWidth(cp: number): number {
  if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) return 0
  if (cp < 0x0300) return 1 // fast path: nothing zero-width or wide below this
  if (inRanges(ZERO, cp)) return 0
  if (inRanges(WIDE, cp)) return 2
  return 1
}

/** Display columns of a string, summed over its code points. */
export function stringWidth(s: string): number {
  let w = 0
  for (const ch of s) w += codePointWidth(ch.codePointAt(0) as number)
  return w
}

/**
 * Display columns of a single character, floored at 1.
 *
 * Text drawing advances the cursor by this, so a zero-width mark still claims
 * a cell rather than overwriting its neighbour. Mirrors `char_width(c).max(1)`
 * at the Rust call sites that paint glyphs.
 */
export function drawWidth(ch: string): number {
  return Math.max(1, codePointWidth(ch.codePointAt(0) as number))
}
