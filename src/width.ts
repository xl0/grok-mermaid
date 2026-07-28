import { EMOJI, WIDTHS } from './width-data.ts'

/** Index of the run containing `cp`; the table covers every code point. */
function runAt(cp: number): [number, number, number, number] {
  let lo = 0
  let hi = WIDTHS.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const run = WIDTHS[mid]
    if (cp < run[0]) hi = mid - 1
    else if (cp > run[1]) lo = mid + 1
    else return run
  }
  return [cp, cp, 1, 1]
}

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
 * Display columns of one code point, matching `unicode-width`'s
 * `UnicodeWidthChar::width(c).unwrap_or(0)`: 0 for controls and combining
 * marks, 2 for East Asian Wide and Fullwidth, 1 otherwise.
 *
 * This is the width used when *painting* a character into a cell.
 */
export function codePointWidth(cp: number): number {
  return runAt(cp)[2]
}

/** The same code point's contribution inside a string; see `stringWidth`. */
function inStringWidth(cp: number): number {
  return runAt(cp)[3]
}

const isEmoji = (cp: number): boolean => inRanges(EMOJI, cp)
const isRegionalIndicator = (cp: number): boolean => cp >= 0x1f1e6 && cp <= 0x1f1ff
const isSkinTone = (cp: number): boolean => cp >= 0x1f3fb && cp <= 0x1f3ff

const ZWJ = 0x200d
const VS15 = 0xfe0e
const VS16 = 0xfe0f
const KEYCAP = 0x20e3
const CR = 0x0d
const LF = 0x0a

/**
 * Display columns of a string, reproducing `UnicodeWidthStr::width`.
 *
 * Deliberately not a sum of `codePointWidth`. The crate's string width differs
 * from its per-character width in two ways the renderer depends on:
 *
 * 1. A control character costs one column here but zero per code point —
 *    `UnicodeWidthChar` returns `None`, which callers fold to 0. Collapsing
 *    the two mismeasures any label or source line containing a tab.
 * 2. Emoji presentation sequences fuse: a ZWJ joining two pictographs, a
 *    skin-tone modifier, an `FE0F` promotion, a keycap, or a regional
 *    indicator pair each measure as one 2-column cluster, not as their parts.
 *
 * Not implemented: the crate's script-specific ligatures (Arabic Lam-Alef,
 * Hebrew Alef-Lamed, Khmer Coeng, Buginese, Lisu, Old Turkic, Tifinagh, Kirat
 * Rai), emoji tag sequences, and the quote + `FE00`/`FE01`/`FE02` cases. Those
 * need several more Unicode property tables and do not arise in diagram
 * labels; `tools/differential` will catch it if that assumption ever breaks.
 */
export function stringWidth(s: string): number {
  const cps: number[] = []
  for (const ch of s) cps.push(ch.codePointAt(0) as number)

  let w = 0
  let i = 0
  while (i < cps.length) {
    const cp = cps[i]

    // A CRLF pair is one line break, so it costs one column, not two.
    if (cp === CR && cps[i + 1] === LF) {
      w += 1
      i += 2
      continue
    }

    // A pair of regional indicators is one flag; an odd one stands alone.
    if (isRegionalIndicator(cp)) {
      const pair = isRegionalIndicator(cps[i + 1] ?? -1)
      w += pair ? 2 : inStringWidth(cp)
      i += pair ? 2 : 1
      continue
    }

    let width = inStringWidth(cp)
    i++

    // Variation selectors and keycaps modify a preceding base. With no base to
    // attach to — a sequence cut by line chunking — they stay zero-width.
    if (width > 0) {
      if (cps[i] === VS16) {
        width = 2
        i++
      } else if (cps[i] === VS15) {
        width = 1
        i++
      }
      if (cps[i] === KEYCAP) {
        width = 2
        i++
      }
    }
    i = consumeModifiers(cps, i)

    // A ZWJ fuses the next pictograph into this cluster, contributing nothing.
    while (isEmoji(cp) && cps[i] === ZWJ && isEmoji(cps[i + 1] ?? -1)) {
      i += 2
      if (cps[i] === VS16 || cps[i] === VS15) i++
      i = consumeModifiers(cps, i)
    }

    w += width
  }
  return w
}

/** Skip skin-tone modifiers, which fold into the preceding pictograph. */
function consumeModifiers(cps: number[], i: number): number {
  while (i < cps.length && isSkinTone(cps[i])) i++
  return i
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
