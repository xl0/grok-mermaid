import { expect, test } from 'bun:test'
import { parseClass, pushMember } from '../src/diagrams/class.ts'
import { parseEr, pushErAttribute } from '../src/diagrams/er.ts'
import { parseGraph } from '../src/diagrams/flowchart.ts'
import { parseSequence } from '../src/diagrams/sequence.ts'
import { parseState } from '../src/diagrams/state.ts'
import type { Node } from '../src/graph.ts'

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

test('html tags are stripped from labels', () => {
  const g = graphOf('flowchart TD\n  A["<b>Bold</b> and <i>italic</i>"] --> B')
  expect(g.nodes[0].label).toBe('Bold and italic')
})

test('a br tag becomes a space', () => {
  const g = graphOf('flowchart TD\n  A["Line1<br/>Line2<br>Line3"]')
  expect(g.nodes[0].label).toBe('Line1 Line2 Line3')
})

test('markdown strings strip bold, italic and code', () => {
  const g = graphOf(
    'flowchart TD\n  A["`**Start** here`"] --> B["`Save to **database**`"]\n  B --> C["`**Done!**`"]',
  )
  expect(g.nodes.map((n) => n.label)).toEqual(['Start here', 'Save to database', 'Done!'])
})

test('markdown strings keep snake_case and strip inline code', () => {
  const g = graphOf('flowchart TD\n  A["`_italic_ uses `vocab_size` with __all__`"]')
  expect(g.nodes[0].label).toBe('italic uses vocab_size with all')
})

test('markdown edge labels are stripped', () => {
  const g = graphOf('flowchart TD\n  A -->|"`**yes**`"| B\n  A -->|"`__no__`"| C')
  expect(g.edges[0].label).toBe('yes')
  expect(g.edges[1].label).toBe('no')
})

test('a plain label keeps literal text and underscores', () => {
  // Not a markdown string (no backtick wrapper): Mermaid renders it literally,
  // so brackets, snake_case and any `*`/`_` must survive.
  const g = graphOf('flowchart TD\n  A["[ 464, 3797 ] seq_len d_model"]')
  expect(g.nodes[0].label).toBe('[ 464, 3797 ] seq_len d_model')
})

test('code and span tags are stripped', () => {
  const g = graphOf(
    'flowchart TD\n  A["<code>vocab_size</code> <span style=\\"color:red\\">x</span>"]',
  )
  expect(g.nodes[0].label).toBe('vocab_size x')
})

test('bare angle brackets are kept', () => {
  expect(graphOf('flowchart TD\n  A["a < b and c > d"]').nodes[0].label).toBe('a < b and c > d')
})

test('generic types are not stripped as html', () => {
  // `<String>` / `<i32>` / `<id>` look like tags but are not formatting tags.
  const g = graphOf('flowchart TD\n  A["Returns Vec<String>"] --> B["Option<i32> for <id>"]')
  expect(g.nodes.map((n) => n.label)).toEqual(['Returns Vec<String>', 'Option<i32> for <id>'])
})

test('a quoted label with inner brackets is one node', () => {
  const g = graphOf('flowchart TD\n  IDs["<b>Token IDs</b><br/>[ 464, 3797 ]<br/><i>indices</i>"]')
  expect(g.nodes.length).toBe(1)
  expect(g.edges.length).toBe(0)
  expect(g.nodes[0].label).toBe('Token IDs [ 464, 3797 ] indices')
})

test('an unquoted label with an embedded quote closes at the bracket', () => {
  const g = graphOf('flowchart TD\n  A[5" pipe] --> B[24" display]')
  expect(g.nodes.length).toBe(2)
  expect(g.edges.length).toBe(1)
  expect(g.nodes.map((n) => n.label)).toEqual(['5" pipe', '24" display'])
})

test('a quoted label with inner parens is one node', () => {
  const g = graphOf('flowchart TD\n  A["Tokenizer (BPE / WordPiece)"] --> B[Done]')
  expect(g.nodes.length).toBe(2)
  expect(g.edges.length).toBe(1)
  expect(g.nodes[0].label).toBe('Tokenizer (BPE / WordPiece)')
})

test('an inline label containing x or o letters still parses', () => {
  const g = graphOf('graph TD\n A -- no exit --> B')
  expect(g.nodes.length).toBe(2)
  expect(g.edges.length).toBe(1)
  expect(g.edges[0].label).toBe('no exit')
})

test('an inline label starting with o still parses', () => {
  const g = graphOf('graph TD\n A -- or else --> B')
  expect(g.nodes.length).toBe(2)
  expect(g.edges[0].label).toBe('or else')
})

test('a reversed arrow swaps the edge direction', () => {
  const g = graphOf('graph TD\n A <-- B')
  expect(g.edges.length).toBe(1)
  expect(g.edges[0].from).toBe(idx(g, 'B'))
  expect(g.edges[0].to).toBe(idx(g, 'A'))
  expect(g.edges[0].headTo).toBe('arrow')
  expect(g.edges[0].headFrom).toBe('none')
})

test('a semicolon and comment survive inside a quoted label', () => {
  const g = graphOf('graph TD\n A["wait; 50%% done"] --> B')
  expect(g.nodes.length).toBe(2)
  expect(g.nodes[0].label).toBe('wait; 50%% done')
})

test('a comment outside quotes is stripped', () => {
  const g = graphOf('graph TD %% main flow\n A --> B %% trailing\n %% full line\n')
  expect(g.nodes.length).toBe(2)
  expect(g.edges.length).toBe(1)
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

test('circle and cross endings create no phantom nodes', () => {
  const g = graphOf('graph TD\n A --o B\n C --x D')
  expect(g.nodes.length).toBe(4)
  expect(g.index.has('o')).toBe(false)
  expect(g.index.has('x')).toBe(false)
  expect(g.edges[0].headTo).toBe('circle')
  expect(g.edges[1].headTo).toBe('cross')
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

test('a choice state parses as a diamond', () => {
  const g = parseState(
    'stateDiagram-v2\n state c <<choice>>\n A --> c\n c --> B: yes\n c --> D: no',
  )
  if (g === null) throw new Error('parseState returned null')
  expect(g.nodes[g.index.get('c') as number].shape).toBe('diamond')
  expect(g.edges.length).toBe(3)
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

test('chained state transitions parse as separate edges', () => {
  const g = parseState('stateDiagram-v2\n A --> B --> C')
  if (g === null) throw new Error('parseState returned null')
  expect(g.nodes.length).toBe(3)
  expect(g.edges.length).toBe(2)
  expect(g.index.has('B') && g.index.has('C')).toBe(true)
  expect(g.nodes.some((n) => n.label.includes('-->'))).toBe(false)
  const at = (id: string) => g.index.get(id) as number
  expect(g.edges.some((e) => e.from === at('A') && e.to === at('B'))).toBe(true)
  expect(g.edges.some((e) => e.from === at('B') && e.to === at('C'))).toBe(true)
})

test('a state chain with markers and a label', () => {
  const g = parseState('stateDiagram-v2\n [*] --> A --> B: done')
  if (g === null) throw new Error('parseState returned null')
  expect(g.edges.length).toBe(2)
  expect(g.edges.some((e) => e.label === 'done')).toBe(true)
})

// ------------------------------------------------------------- class and ER

test('class realization is a dotted triangle', () => {
  const cls = parseClass('classDiagram\n IShape <|.. Circle')
  expect(cls?.edges[0].headFrom).toBe('triangle')
  expect(cls?.edges[0].line).toBe('dotted')
})

test('class dependency is a dotted arrow', () => {
  const cls = parseClass('classDiagram\n A ..> B')
  expect(cls?.edges[0].headTo).toBe('arrow')
  expect(cls?.edges[0].line).toBe('dotted')
})

test('ER cardinality operators map to labels', () => {
  const cases: [string, string, string][] = [
    ['||--||', '1', '1'],
    ['|o--o|', '0..1', '0..1'],
    ['}o--o{', '0..*', '0..*'],
    ['}|--|{', '1..*', '1..*'],
    ['||--o{', '1', '0..*'],
  ]
  for (const [op, l, r] of cases) {
    const g = parseEr(`erDiagram\n A ${op} B : x`)
    expect(g?.edges[0].label).toBe(`${l} x ${r}`)
    expect(g?.edges[0].line).toBe('solid')
  }
  expect(parseEr('erDiagram\n A ||..o{ B : x')?.edges[0].line).toBe('dotted')
  expect(parseEr('erDiagram\n A ||==o{ B : x')).toBeNull()
  expect(parseEr('erDiagram\n A garbage B : x')).toBeNull()
})

test('an ER entity may be declared bare', () => {
  const g = parseEr('erDiagram\n LONER\n A ||--|| B : linked')
  expect(g?.nodes.length).toBe(3)
})
