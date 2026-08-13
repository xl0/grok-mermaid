/**
 * The shared statement layer: source text to statements, plus the small
 * string-reading helpers every grammar leans on.
 */

import { asciiLower, isIdChar, srcLines } from './labels.ts'

function flushStatement(cur: string, out: string[]): string {
  const trimmed = cur.trim()
  if (trimmed !== '') out.push(trimmed)
  return ''
}

/**
 * Split one source line into statements on `;`, stopping at a `%%` comment.
 *
 * Quoted spans are opaque, so a label may contain `;` and `%%`.
 */
export function splitStatements(line: string, out: string[]): void {
  const chars = [...line]
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    if (inQuotes) {
      if (c === '"') inQuotes = false
      cur += c
    } else if (c === '"') {
      inQuotes = true
      cur += c
    } else if (c === '%' && chars[i + 1] === '%') {
      break
    } else if (c === ';') {
      cur = flushStatement(cur, out)
    } else {
      cur += c
    }
  }
  flushStatement(cur, out)
}

/** All statements in a source block, in order. */
export function statementsOf(src: string): string[] {
  const out: string[] = []
  for (const line of srcLines(src)) splitStatements(line, out)
  return out
}

export const firstWord = (s: string): string => s.split(/\s+/).filter((w) => w !== '')[0] ?? ''
export const words = (s: string): string[] => s.split(/\s+/).filter((w) => w !== '')

/** Split on the first occurrence of `sep`, Rust's `split_once`. */
export function splitOnce(s: string, sep: string): [string, string] | null {
  const i = s.indexOf(sep)
  return i === -1 ? null : [s.slice(0, i), s.slice(i + sep.length)]
}

export const nonEmpty = (s: string): string | null => (s === '' ? null : s)

/** Diagram kind from the header statement, lowercased. */
export function headerKind(statements: string[]): string | null {
  const header = statements[0]
  if (header === undefined) return null
  const kind = firstWord(header)
  return kind === '' ? null : asciiLower(kind)
}

/**
 * Parse the body of a `classDef` statement: `name[,name2] k1:v1,k2:v2`.
 * Values are kept verbatim; malformed pairs are skipped.
 */
export function parseClassDef(
  rest: string,
): { names: string[]; props: Record<string, string> } | null {
  const body = rest.trim()
  const ws = body.search(/\s/)
  if (ws === -1) return null
  const names = body
    .slice(0, ws)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
  const props: Record<string, string> = {}
  for (const pair of body.slice(ws).trim().split(',')) {
    const kv = splitOnce(pair, ':')
    if (kv === null) continue
    const k = kv[0].trim()
    const v = kv[1].trim()
    if (k !== '' && v !== '') props[k] = v
  }
  return names.length === 0 ? null : { names, props }
}

/**
 * Remove every `:::name` style tag from a statement, parsed with the same
 * name scan as the flowchart shorthand. State and class statements are read
 * by string splits, and the `:` label split would cut inside a `:::`, so tags
 * are dropped before dispatch rather than at each id.
 */
export function dropStyleTags(st: string): string {
  const chars = [...st]
  const out: string[] = []
  for (let i = 0; i < chars.length; ) {
    if (chars[i] === ':' && chars[i + 1] === ':' && chars[i + 2] === ':') {
      let k = i + 3
      while (k < chars.length && (isIdChar(chars[k]) || chars[k] === '-')) k++
      while (k > i + 3 && chars[k - 1] === '-') k--
      if (k > i + 3) {
        i = k
        continue
      }
    }
    out.push(chars[i])
    i++
  }
  return out.join('')
}
