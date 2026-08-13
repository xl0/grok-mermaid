import { expect, test } from 'bun:test'
import { parseClass, pushMember } from '../src/diagrams/class.ts'
import { pushErAttribute } from '../src/diagrams/er.ts'
import { parseGraph } from '../src/diagrams/flowchart.ts'
import { parseSequence } from '../src/diagrams/sequence.ts'
import { parseState } from '../src/diagrams/state.ts'
import type { Node } from '../src/graph.ts'

// Label processing and rendering shape are pinned by the golden files in
// test/cases/. What lives here are model-level invariants the art can't show.

const graphOf = (src: string) => {
  const g = parseGraph(src)
  if (g === null) throw new Error('parseGraph returned null')
  return g
}
const idx = (g: ReturnType<typeof graphOf>, id: string): number => {
  const i = g.index.get(id)
  if (i === undefined) throw new Error(`no node ${id}`)
  return i
}

// -------------------------------------------------------------- flowchart

test('parses nodes, edges and direction', () => {
  const g = graphOf('flowchart LR\n  A[Start] --> B[End]')
  expect(g.nodes.length).toBe(2)
  expect(g.edges.length).toBe(1)
  expect(g.nodes[0].label).toBe('Start')
  expect(g.nodes[1].label).toBe('End')
  expect(g.dir).toBe('right')
})

test('a non-flowchart source is declined', () => {
  expect(parseGraph('sequenceDiagram\n  A->>B: hi')).toBeNull()
})

test('fan-out creates cross product edges', () => {
  const g = graphOf('graph TD\n A & B --> C & D')
  expect(g.nodes.length).toBe(4)
  expect(g.edges.length).toBe(4)
  const has = (f: string, t: string) =>
    g.edges.some((e) => e.from === idx(g, f) && e.to === idx(g, t))
  expect(has('A', 'C') && has('A', 'D') && has('B', 'C') && has('B', 'D')).toBe(true)
})

test('fan-out works mid-chain', () => {
  expect(graphOf('graph LR\n A & B --> C --> D').edges.length).toBe(3)
})

test('fan-out with a reversed arrow', () => {
  const g = graphOf('graph TD\n A & B <-- C')
  expect(g.edges.length).toBe(2)
  expect(g.edges.every((e) => e.from === idx(g, 'C'))).toBe(true)
  expect(g.edges.every((e) => e.headTo === 'arrow')).toBe(true)
})

test('left endings decorate without reversing', () => {
  const g = graphOf('graph TD\n A o-- B\n C x-- D')
  expect(g.edges[0].from).toBe(idx(g, 'A'))
  expect(g.edges[0].to).toBe(idx(g, 'B'))
  expect(g.edges[0].headFrom).toBe('circle')
  expect(g.edges[0].headTo).toBe('none')
  expect(g.edges[1].headFrom).toBe('cross')
})

test('a reversed arrow with an end marker swaps direction', () => {
  const g = graphOf('graph TD\n A <--o B\n C <--x D')
  expect(g.edges[0].from).toBe(idx(g, 'B'))
  expect(g.edges[0].to).toBe(idx(g, 'A'))
  expect(g.edges[0].headTo).toBe('arrow')
  expect(g.edges[0].headFrom).toBe('circle')
  expect(g.edges[1].from).toBe(idx(g, 'D'))
  expect(g.edges[1].to).toBe(idx(g, 'C'))
  expect(g.edges[1].headFrom).toBe('cross')
})

test('both end markers parse', () => {
  const g = graphOf('graph TD\n A o--o B\n C x--x D')
  expect(g.edges[0].headFrom).toBe('circle')
  expect(g.edges[0].headTo).toBe('circle')
  expect(g.edges[1].headFrom).toBe('cross')
  expect(g.edges[1].headTo).toBe('cross')
  expect(g.nodes.length).toBe(4)
})

test('a groupless flowchart records no subgraphs', () => {
  expect(graphOf('graph TD\n A --> B').groups.length).toBe(0)
})

test('a subgraph id may be referenced before its declaration', () => {
  const g = graphOf('graph TD\n X --> two\n subgraph two\n C --> D\n end')
  expect(g.groups.length).toBe(1)
})

// ------------------------------------------------------------------ state

test('entities decode at every direct-push sink', () => {
  // Entities contain `;`, which the statement splitter treats as a separator,
  // so they only reach a sink intact inside quotes.
  const g = parseState(
    'stateDiagram-v2\n  state "work &lt;job&gt;" as J\n  Idle --> Run: "on &lt;go&gt;"\n  Run: "d &lt;e&gt;"',
  )
  if (g === null) throw new Error('parseState returned null')
  const node = (s: string) => g.nodes.some((n) => n.label.includes(s))
  const edge = (s: string) => g.edges.some((e) => e.label?.includes(s) === true)
  expect(node('work <job>') && node('d <e>') && edge('on <go>')).toBe(true)
  expect(node('&lt;') || edge('&lt;')).toBe(false)

  const cls = parseClass('classDiagram\n  A --> B : "uses &lt;X&gt;"')
  expect(
    cls?.edges.some((e) => e.label?.includes('uses <X>') === true && !e.label.includes('&lt;')),
  ).toBe(true)

  const seq = parseSequence(
    'sequenceDiagram\n  A->>B: "call &lt;svc&gt;"\n  Note over A,B: "memo &lt;o&gt;"\n  alt "c &lt;x&gt;"\n    A->>B: ok\n  end',
  )
  if (seq === null) throw new Error('parseSequence returned null')
  const hasItem = (kind: string, s: string) =>
    seq.items.some(
      (it) =>
        it.kind === kind &&
        ((it as { text?: string | null }).text?.includes(s) ?? false) &&
        !((it as { text?: string | null }).text?.includes('&lt;') ?? false),
    )
  expect(hasItem('message', 'call <svc>')).toBe(true)
  expect(hasItem('note', 'memo <o>')).toBe(true)
  expect(hasItem('divider', 'c <x>')).toBe(true)

  // Class members and ER attributes have no clean quoted form, so exercise
  // those decodes at the finalizer directly.
  const member: Node = { label: 'M', shape: 'rect', sections: [['M'], [], []] }
  pushMember(member, '+run &lt;R&gt;')
  expect(member.sections?.[1]).toEqual(['+run <R>'])
  const attr: Node = { label: 'A', shape: 'rect', sections: [['A'], []] }
  pushErAttribute(attr, 'string &lt;pk&gt;')
  expect(attr.sections?.[1]).toEqual(['string <pk>'])
})

test('a state description preserves the choice shape', () => {
  const g = parseState('stateDiagram-v2\n state c <<choice>>\n c : pick a path\n A --> c\n c --> B')
  if (g === null) throw new Error('parseState returned null')
  const c = g.index.get('c') as number
  expect(g.nodes[c].shape).toBe('diamond')
  expect(g.nodes[c].label).toBe('pick a path')

  const g2 = parseState('stateDiagram-v2\n state c <<choice>>\n state "pick" as c\n A --> c')
  if (g2 === null) throw new Error('parseState returned null')
  const c2 = g2.index.get('c') as number
  expect(g2.nodes[c2].shape).toBe('diamond')
  expect(g2.nodes[c2].label).toBe('pick')
})

test('an extra dash in a state arrow is tolerated', () => {
  const g = parseState('stateDiagram-v2\n A ---> B')
  if (g === null) throw new Error('parseState returned null')
  expect(g.edges.length).toBe(1)
  expect(g.nodes.length).toBe(2)
})
