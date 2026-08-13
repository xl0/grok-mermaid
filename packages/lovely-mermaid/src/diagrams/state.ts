/**
 * `stateDiagram` / `stateDiagram-v2`: states, transitions and descriptions.
 * Lenient: an unreadable statement is dropped and recorded in `warnings`.
 */

import { Graph, parseDir, type Shape } from '../graph.ts'
import { asciiLower, decodeHtmlEntities } from '../labels.ts'
import { layoutFlowchart } from '../layout.ts'
import type { Diagram } from '../registry.ts'
import {
  dropStyleTags,
  firstWord,
  headerKind,
  nonEmpty,
  parseClassDef,
  splitOnce,
  statementsOf,
  words,
} from '../statements.ts'

export const state: Diagram = {
  kind: 'state',
  headers: ['statediagram', 'statediagram-v2'],
  render(src) {
    const graph = parseState(src)
    if (graph === null) return null
    const canvas = layoutFlowchart(graph)
    if (canvas === null) return null
    return { canvas, warnings: graph.warnings, classDefs: graph.classDefs }
  },
}

export function parseState(src: string): Graph | null {
  const statements = statementsOf(src)
  const kind = headerKind(statements)
  if (kind === null || !state.headers.includes(kind)) return null

  const graph = new Graph()
  let inNote = false
  /** `class A,B name` assignments, applied after the walk. */
  const classAssignments: [string[], string[]][] = []

  for (let st of statements.slice(1)) {
    if (inNote) {
      if (asciiLower(st) === 'end note') inNote = false
      continue
    }
    st = dropStyleTags(st)
    const first = asciiLower(firstWord(st))
    if (first === 'direction') {
      graph.dir = parseDir(words(st)[1] ?? '')
    } else if (first === 'note') {
      // A single-line `note ... : text` needs no terminator.
      if (!st.includes(':')) inNote = true
    } else if (first === 'state') {
      if (parseStateDecl(st, graph) === null) graph.drop(st)
    } else if (first === 'classdef') {
      const def = parseClassDef(st.slice(firstWord(st).length))
      if (def) for (const name of def.names) graph.classDefs[name] = def.props
    } else if (first === 'class') {
      const rest = st.slice(firstWord(st).length).trim()
      const ids = firstWord(rest).split(',')
      const names = rest.slice(firstWord(rest).length).trim().split(',')
      classAssignments.push([ids, names])
    } else if (['hide', 'scale', '}', '--'].includes(first)) {
      // Styling and composite-state punctuation carry no layout meaning.
    } else if (st.includes('-->')) {
      if (parseTransition(st, graph) === null) graph.drop(st)
    } else if (parseStateDesc(st, graph) === null) {
      graph.drop(st)
    }
    if (graph.truncated !== null) {
      graph.warnings.push(`diagram truncated: ${graph.truncated}`)
      break
    }
  }

  for (const [ids, names] of classAssignments) {
    for (const id of ids) {
      const idx = graph.index.get(id.trim())
      if (idx === undefined) continue
      for (const name of names) {
        if (name.trim() !== '') graph.addClass(idx, name.trim())
      }
    }
  }

  return graph.nodes.length === 0 ? null : graph
}

/** `state "Label" as id`, `state id <<choice>>`, or `state id {`. */
function parseStateDecl(st: string, graph: Graph): true | null {
  const rest = st.slice('state'.length).trim().replace(/\{$/, '').trim()
  if (rest === '') return true

  if (rest.startsWith('"')) {
    const close = rest.indexOf('"', 1)
    if (close === -1) return null
    const label = rest.slice(1, close)
    const after = rest.slice(close + 1).trim()
    const id = after.startsWith('as') ? after.slice(2).trim() : label
    return graph.nodeLabel(id, decodeHtmlEntities(label)) === null ? null : true
  }

  let shape: Shape = 'round'
  let id = rest
  let stereotyped = false
  const pos = rest.indexOf('<<')
  if (pos !== -1) {
    const stereo = rest
      .slice(pos + 2)
      .replace(/>>$/, '')
      .trim()
    if (stereo === 'choice') shape = 'diamond'
    id = rest.slice(0, pos).trim()
    stereotyped = true
  }
  if (id === '' || /\s/.test(id)) return null
  return graph.nodeIndex(id, stereotyped ? id : null, shape) === null ? null : true
}

/** `A --> B: label`, including chains `A --> B --> C`. */
function parseTransition(st: string, graph: Graph): true | null {
  let rest = st
  let prev: number | null = null

  for (;;) {
    const split = splitOnce(rest, '-->')
    if (!split) break
    const [lhs, rhs] = split

    const fromId = lhs.trimEnd().replace(/-+$/, '').trim()
    let from: number
    if (prev !== null) {
      // Mid-chain: the source is the previous target, so nothing may precede.
      if (fromId !== '') return null
      from = prev
    } else {
      if (fromId === '') return null
      const f = stateEndpoint(graph, fromId, true)
      if (f === null) return null
      from = f
    }

    const nextArrow = rhs.indexOf('-->')
    const toPartRaw = nextArrow === -1 ? rhs : rhs.slice(0, nextArrow)
    const tail = nextArrow === -1 ? '' : rhs.slice(nextArrow)

    const colon = splitOnce(toPartRaw, ':')
    const toPart = colon ? colon[0] : toPartRaw
    const label = colon ? nonEmpty(decodeHtmlEntities(colon[1].trim())) : null

    const toId = toPart.trimStart().replace(/^>+/, '').trimEnd().replace(/-+$/, '').trim()
    if (toId === '') return null
    const to = stateEndpoint(graph, toId, false)
    if (to === null) return null

    if (!graph.pushEdge({ from, to, label, headTo: 'arrow', headFrom: 'none', line: 'solid' })) {
      return true
    }
    prev = to
    rest = tail
  }
  return true
}

/** `[*]` is start or end depending on which side of the arrow it sits. */
function stateEndpoint(graph: Graph, id: string, isSource: boolean): number | null {
  if (id === '[*]') return graph.nodeIndex(isSource ? '[*]start' : '[*]end', '●', 'round')
  return graph.nodeIndex(id, null, 'round')
}

/** `id: description`, or a bare state name. */
function parseStateDesc(st: string, graph: Graph): true | null {
  const split = splitOnce(st, ':')
  if (split) {
    const id = split[0].trim()
    const desc = split[1].trim()
    if (id === '' || /\s/.test(id) || desc === '') return null
    return graph.nodeLabel(id, decodeHtmlEntities(desc)) === null ? null : true
  }
  if (/\s/.test(st)) return null
  return graph.nodeIndex(st, null, 'round') === null ? null : true
}
