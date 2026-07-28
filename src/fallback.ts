/**
 * The fallback rendering: the raw source in a framed box.
 *
 * Used for diagram types this renderer does not draw, and for diagrams that do
 * not fit the available width — the latter also get an advisory note pointing
 * the reader at the image.
 */

import { srcLines } from './labels.ts'
import type { MermaidArt, Span } from './types.ts'
import { drawWidth, stringWidth } from './width.ts'

const TOO_WIDE_HINT =
  'This diagram is too wide to display here — open the image to view it in full.'

const sat = (a: number, b: number): number => Math.max(0, a - b)

export function fallback(src: string, maxWidth: number | undefined, tooWide: boolean): MermaidArt {
  const header = src.split(/\s+/).filter((w) => w !== '')[0] ?? 'diagram'
  const title = ` mermaid: ${header} `
  const limit = maxWidth === undefined ? undefined : Math.max(8, sat(maxWidth, 4))

  const body = srcLines(src)
    .map((l) => l.replace(/\s+$/, ''))
    .reduce<{ started: boolean; lines: string[] }>(
      (acc, l) => {
        if (!acc.started && l === '') return acc
        acc.started = true
        acc.lines.push(...chunkLine(l, limit))
        return acc
      },
      { started: false, lines: [] },
    ).lines

  const contentW = Math.max(stringWidth(title), ...body.map(stringWidth), 0)
  const inner = contentW + 2

  const plain: string[] = []
  const styled: Span[][] = []

  const rule = '─'.repeat(sat(inner, stringWidth(title)))
  plain.push(`╭${title}${rule}╮`)
  styled.push([
    { text: '╭', cls: 'border' },
    { text: title, cls: 'title' },
    { text: `${rule}╮`, cls: 'border' },
  ])

  for (const line of body) {
    const pad = ' '.repeat(sat(contentW, stringWidth(line)))
    plain.push(`│ ${line}${pad} │`)
    styled.push([
      { text: '│ ', cls: 'border' },
      { text: line, cls: 'text' },
      { text: `${pad} │`, cls: 'border' },
    ])
  }

  const bottom = `╰${'─'.repeat(inner)}╯`
  plain.push(bottom)
  styled.push([{ text: bottom, cls: 'border' }])

  if (tooWide) {
    for (const chunk of wrapWords(TOO_WIDE_HINT, maxWidth)) {
      plain.push(chunk)
      styled.push([{ text: chunk, cls: 'hint' }])
    }
  }

  return { plain, styled }
}

/** Hard-break a line at `limit` columns, never splitting a wide glyph. */
function chunkLine(line: string, limit: number | undefined): string[] {
  if (limit === undefined || stringWidth(line) <= limit) return [line]
  const out: string[] = []
  let cur = ''
  let curW = 0
  for (const c of line) {
    const cw = drawWidth(c)
    if (curW + cw > limit && cur !== '') {
      out.push(cur)
      cur = ''
      curW = 0
    }
    cur += c
    curW += cw
  }
  if (cur !== '') out.push(cur)
  return out
}

function wrapWords(text: string, limit: number | undefined): string[] {
  if (limit === undefined) return [text]
  const lines: string[] = []
  let cur = ''
  for (const word of text.split(' ').filter((w) => w !== '')) {
    if (cur === '') cur = word
    else if (stringWidth(cur) + 1 + stringWidth(word) <= limit) cur += ` ${word}`
    else {
      lines.push(cur)
      cur = word
    }
  }
  if (cur !== '') lines.push(cur)
  return lines.flatMap((l) => chunkLine(l, limit))
}
