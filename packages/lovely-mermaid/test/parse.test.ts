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

// -------------------------------------------------------------- flowchart

test('a non-flowchart source is declined', () => {
  expect(parseGraph('sequenceDiagram\n  A->>B: hi')).toBeNull()
})

test('a groupless flowchart records no subgraphs', () => {
  expect(graphOf('graph TD\n A --> B').groups.length).toBe(0)
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

test('classDef function-syntax values keep their commas', () => {
  const g = parseGraph('graph TD\n A\n classDef c fill:rgb(255, 0, 0),stroke:#333')
  if (g === null) throw new Error('parseGraph returned null')
  expect(g.classDefs.c).toEqual({ fill: 'rgb(255, 0, 0)', stroke: '#333' })
})

test('class ids survive a space after the comma', () => {
  const g = parseGraph('graph TD\n A --> B\n class A, B warn')
  if (g === null) throw new Error('parseGraph returned null')
  expect(g.nodes.map((n) => n.classes)).toEqual([['warn'], ['warn']])
})

test('a `:::` tag before a description colon stays a tag', () => {
  const g = parseState('stateDiagram-v2\n S1:::hot : waiting\n A --> B:::cold : go')
  if (g === null) throw new Error('parseState returned null')
  const s1 = g.nodes[g.index.get('S1') as number]
  expect(s1.label).toBe('waiting')
  expect(s1.classes).toEqual(['hot'])
  const b = g.nodes[g.index.get('B') as number]
  expect(b.classes).toEqual(['cold'])
  expect(g.edges[0].label).toBe('go')
})

test('an activation at the item cap is dropped with the item', () => {
  const msgs = Array.from({ length: 512 }, () => 'A->>B: m').join('\n')
  const seq = parseSequence(`sequenceDiagram\n${msgs}\nA->>+B: over`)
  if (seq === null) throw new Error('parseSequence returned null')
  expect(seq.activations).toEqual([])
  expect(seq.warnings.at(-1)).toContain('truncated')
})

test('class-diagram class assignments: `class X name` and cssClass', () => {
  const g = parseClass(
    'classDiagram\n cssClass "Agent,Tool" hot\n class Agent {\n +run()\n }\n class Agent focus\n Tool <|-- Agent',
  )
  if (g === null) throw new Error('parseClass returned null')
  expect(g.nodes[g.index.get('Agent') as number].classes).toEqual(['hot', 'focus'])
  expect(g.nodes[g.index.get('Tool') as number].classes).toEqual(['hot'])
  expect(g.warnings).toEqual([])
})

test('a `:::` tag glued to a link keeps the link', () => {
  const g = parseGraph('graph TD\n A:::x-->B')
  if (g === null) throw new Error('parseGraph returned null')
  expect(g.edges.length).toBe(1)
  expect(g.nodes[0].classes).toEqual(['x'])
  expect(g.warnings).toEqual([])
})
