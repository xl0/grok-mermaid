/**
 * `classDiagram`: classes with member compartments and UML relations.
 * Lenient: an unreadable statement is dropped and recorded in `warnings`.
 *
 * Compartments live on `Node.sections`: `[title, attrs, methods]`, where the
 * title is the optional `«annotation»` line followed by the class name.
 */

import { Graph, type Head, type LineKind, MAX_MEMBERS, type Node, parseDir } from '../graph.ts'
import { asciiLower, decodeHtmlEntities, displayGenerics, isIdChar } from '../labels.ts'
import { layoutClass } from '../layout.ts'
import type { Diagram } from '../registry.ts'
import {
  firstWord,
  headerKind,
  nonEmpty,
  parseClassDef,
  quoteMask,
  splitColon,
  splitOnce,
  statementsOf,
  takeTags,
  words,
} from '../statements.ts'

export const classDiagram: Diagram = {
  kind: 'class',
  headers: ['classdiagram', 'classdiagram-v2'],
  render(src) {
    const graph = parseClass(src)
    if (graph === null) return null
    const canvas = layoutClass(graph)
    if (canvas === null) return null
    return { canvas, warnings: graph.warnings, classDefs: graph.classDefs }
  },
}

/** Relation operators, longest-first so `--|>` wins over `--`. */
const CLASS_OPS: [string, Head, Head, LineKind][] = [
  ['<|--', 'triangle', 'none', 'solid'],
  ['--|>', 'none', 'triangle', 'solid'],
  ['<|..', 'triangle', 'none', 'dotted'],
  ['..|>', 'none', 'triangle', 'dotted'],
  ['*--', 'diamondFill', 'none', 'solid'],
  ['--*', 'none', 'diamondFill', 'solid'],
  ['o--', 'diamondOpen', 'none', 'solid'],
  ['--o', 'none', 'diamondOpen', 'solid'],
  ['<--', 'arrow', 'none', 'solid'],
  ['-->', 'none', 'arrow', 'solid'],
  ['<..', 'arrow', 'none', 'dotted'],
  ['..>', 'none', 'arrow', 'dotted'],
  ['--', 'none', 'none', 'solid'],
  ['..', 'none', 'none', 'dotted'],
]

const MAX_CLASS_OP = 4

export function parseClass(src: string): Graph | null {
  const statements = statementsOf(src)
  const kind = headerKind(statements)
  if (kind === null || !classDiagram.headers.includes(kind)) return null

  const graph = new Graph()
  /** Declare a class from an id token, attaching any `:::` tags it carries. */
  const declare = (token: string): number | null => {
    const { id, classes } = takeTags(token)
    const idx = graph.nodeIndex(id, null, 'rect')
    if (idx !== null) {
      graph.nodes[idx].sections ??= [[displayGenerics(id)], [], []]
      for (const cls of classes) graph.addClass(idx, cls)
    }
    return idx
  }
  /** The open `{` body: a class index, `'skip'` for a dropped class, or none. */
  let curClass: number | 'skip' | null = null

  for (const st of statements.slice(1)) {
    if (curClass !== null) {
      if (st === '}') curClass = null
      else if (curClass !== 'skip') pushMember(graph.nodes[curClass], st)
      continue
    }

    const first = asciiLower(firstWord(st))
    if (first === 'direction') {
      graph.dir = parseDir(words(st)[1] ?? '')
      continue
    }
    if (first === 'classdef') {
      const def = parseClassDef(st.slice(firstWord(st).length))
      if (def) for (const name of def.names) graph.classDefs[name] = def.props
      continue
    }
    if (
      ['note', 'callback', 'click', 'link', 'style', 'cssclass', 'namespace', '}'].includes(first)
    ) {
      continue
    }
    if (first === 'class') {
      const rest = st.slice('class'.length).trim()
      const open = rest.endsWith('{')
      const name = open ? rest.slice(0, -1).trim() : rest
      if (name === '' || /\s/.test(name)) {
        // A bad declaration that opened a body swallows it whole; reading the
        // members as top-level statements would misparse everything inside.
        graph.drop(st)
        if (open) curClass = 'skip'
      } else {
        const idx = declare(name)
        if (open) curClass = idx ?? 'skip'
      }
    } else if (st.startsWith('<<')) {
      const split = splitOnce(st.slice(2), '>>')
      const name = split ? split[1].trim() : ''
      if (split === null || name === '' || /\s/.test(name)) {
        graph.drop(st)
      } else {
        const idx = declare(name)
        if (idx !== null) setAnnotation(graph.nodes[idx], split[0].trim())
      }
    } else {
      const rel = parseClassRelation(st)
      if (rel !== null) {
        const f = declare(rel.from)
        const t = f === null ? null : declare(rel.to)
        if (f !== null && t !== null) {
          graph.pushEdge({
            from: f,
            to: t,
            label: rel.label,
            cardFrom: rel.cardFrom,
            cardTo: rel.cardTo,
            headTo: rel.headTo,
            headFrom: rel.headFrom,
            line: rel.line,
          })
        }
      } else {
        const member = splitColon(st)
        const id = member ? member[0].trim() : ''
        const text = member ? member[1].trim() : ''
        if (member === null || id === '' || /\s/.test(id) || text === '') {
          graph.drop(st)
        } else {
          const idx = declare(id)
          if (idx !== null) pushMember(graph.nodes[idx], text)
        }
      }
    }
    if (graph.truncated !== null) {
      graph.warnings.push(`diagram truncated: ${graph.truncated}`)
      break
    }
  }

  return graph.nodes.length === 0 ? null : graph
}

/** Rewrite the title compartment as `«annotation»` over the class name. */
function setAnnotation(node: Node, annotation: string): void {
  ;(node.sections as string[][])[0] = [`«${annotation}»`, displayGenerics(node.label)]
}

/** Add a member to the attribute or method compartment, eliding past the cap. */
export function pushMember(node: Node, raw: string): void {
  const sections = node.sections as string[][]
  if (raw.startsWith('<<')) {
    const split = splitOnce(raw.slice(2), '>>')
    if (split) setAnnotation(node, split[0].trim())
    return
  }
  const member = decodeHtmlEntities(displayGenerics(raw.trim()))
  const list = member.includes('(') ? sections[2] : sections[1]
  if (list.length < MAX_MEMBERS) list.push(member)
  else if (list.length === MAX_MEMBERS) list.push('…')
}

interface ClassRelation {
  from: string
  to: string
  headFrom: Head
  headTo: Head
  line: LineKind
  label: string | null
  cardFrom?: string
  cardTo?: string
}

function parseClassRelation(st: string): ClassRelation | null {
  const chars = [...st]
  // Skip quoted spans, or the `..` inside a cardinality like `"0..*"` would
  // match the dotted-link operator.
  const quoted = quoteMask(chars)
  let found: { pos: number; op: string; headFrom: Head; headTo: Head; line: LineKind } | null = null

  outer: for (let pos = 0; pos < chars.length; pos++) {
    if (quoted[pos]) continue
    const tail = chars.slice(pos, pos + MAX_CLASS_OP).join('')
    for (const [op, headFrom, headTo, line] of CLASS_OPS) {
      if (!tail.startsWith(op)) continue
      // `o` is also an identifier character: skip a match glued to a name.
      if (op.startsWith('o') && pos > 0 && isIdChar(chars[pos - 1])) continue
      const after = chars[pos + [...op].length]
      if (op.endsWith('o') && after !== undefined && isIdChar(after)) continue
      found = { pos, op, headFrom, headTo, line }
      break outer
    }
  }
  if (!found) return null

  const lhsRaw = chars.slice(0, found.pos).join('').trim()
  const rhsRaw = chars
    .slice(found.pos + [...found.op].length)
    .join('')
    .trim()

  const [lhs, cardFrom] = stripCardinalitySuffix(lhsRaw)
  const [rhs, cardTo] = stripCardinalityPrefix(rhsRaw)

  const split = splitColon(rhs)
  const toId = (split ? split[0] : rhs).trim()
  const relLabel = split ? nonEmpty(decodeHtmlEntities(split[1].trim())) : null

  if (lhs === '' || toId === '' || /\s/.test(lhs) || /\s/.test(toId)) return null

  return {
    from: lhs,
    to: toId,
    headFrom: found.headFrom,
    headTo: found.headTo,
    line: found.line,
    label: relLabel,
    cardFrom: cardFrom === '' ? undefined : cardFrom,
    cardTo: cardTo === '' ? undefined : cardTo,
  }
}

/** `Class "1"` — a quoted cardinality trailing the left-hand name. */
function stripCardinalitySuffix(s: string): [string, string] {
  const t = s.trimEnd()
  if (t.endsWith('"')) {
    const rest = t.slice(0, -1)
    const q = rest.lastIndexOf('"')
    if (q !== -1) return [rest.slice(0, q).trimEnd(), rest.slice(q + 1)]
  }
  return [t, '']
}

/** `"0..*" Class` — a quoted cardinality leading the right-hand name. */
function stripCardinalityPrefix(s: string): [string, string] {
  const t = s.trimStart()
  if (t.startsWith('"')) {
    const rest = t.slice(1)
    const q = rest.indexOf('"')
    if (q !== -1) return [rest.slice(q + 1).trimStart(), rest.slice(0, q)]
  }
  return [t, '']
}
