import { expect, test } from 'bun:test'
import { CONT } from '../src/canvas.ts'
import { diagramKind, render, sourceBox } from '../src/index.ts'
import { stringWidth } from '../src/width.ts'
import { countOf, lines, plain, rowOf } from './helpers.ts'

// --------------------------------------------------------------- flowchart

test('a TD render has boxes, labels and an arrow', () => {
  const out = plain('graph TD\n A[Start] --> B[End]')
  expect(out).toContain('Start')
  expect(out).toContain('End')
  expect(out.includes('┌') || out.includes('╭')).toBe(true)
  expect(out).toContain('▼')
})

test('an edge label is rendered', () => {
  expect(plain('graph TD\n A-->|yes| B')).toContain('yes')
})

test('a `:::` class is swallowed and the edge survives', () => {
  const out = render('flowchart TD\n A:::hot --> B\n classDef hot fill:#f00')
  expect(out?.warnings).toEqual([])
  expect(out?.plain.join('\n')).toContain('▼')
  expect(plain('flowchart LR\n A:::my-class --> B')).toContain('▶')
  expect(plain('flowchart LR\n A:::x-->B')).toContain('▶')
})

test('a `:::` class is swallowed in state and class diagrams', () => {
  const state = plain('stateDiagram-v2\n [*] --> Still:::bad\n Still:::bad --> s2:::hot: go')
  expect(state).toContain('Still')
  expect(state).toContain('go')
  expect(state).not.toContain(':::')
  expect(state).not.toContain('::hot')
  const cls = plain('classDiagram\n class Animal:::hot\n Animal <|-- Dog')
  expect(cls).not.toContain(':::')
  expect(countOf(cls, 'Animal')).toBe(1)
})

test('LR is shorter than TD for a chain', () => {
  const chain = 'A --> B --> C --> D'
  const td = lines(`graph TD\n ${chain}`).length
  const lr = lines(`flowchart LR\n ${chain}`).length
  expect(lr).toBeLessThan(td)
})

test('blank source returns null', () => {
  expect(render('   \n  ')).toBeNull()
})

test('a wide-glyph box stays aligned', () => {
  const rows = lines('graph TD\n A[日本語ab]').filter((l) => l.trim() !== '')
  const widths = rows.map(stringWidth)
  expect(widths.every((w) => w === widths[0])).toBe(true)
  expect(rows.some((l) => l.includes(CONT))).toBe(false)
})

test('a merge draws a single arrowhead', () => {
  const out = plain('graph TD\n A[aaa] --> D[ddddddd]\n B[bb] --> D\n C[ccccc] --> D')
  expect(countOf(out, '▼')).toBe(1)
  expect(out).not.toContain('▼▼')
})

test('a long label wraps without truncation', () => {
  const out = plain('graph TD\n A[Check if the user has permission to access resource] --> B[Done]')
  expect(out).toContain('permission')
  expect(out).toContain('resource')
  expect(out).not.toContain('…')
})

test('a very long label truncates after maxLines', () => {
  const long = 'alpha '.repeat(40).trim()
  expect(plain(`graph TD\n A[${long}] --> B[x]`)).toContain('…')
})

test('a long identifier breaks on a boundary, not mid-segment', () => {
  const out = plain('graph TD\n A[mark_filter_restore_context] --> B[Done]')
  expect(out).toContain('mark_filter_restore_')
  expect(out).toContain('context')
})

test('BT flips the orientation', () => {
  const out = plain('flowchart BT\n A[first] --> B[second] --> C[third]')
  expect(rowOf(out, 'third')).toBeLessThan(rowOf(out, 'first'))
})

test('RL flips the orientation', () => {
  const out = plain('flowchart RL\n A[first] --> B[second] --> C[third]')
  const line = out.split('\n').find((l) => l.includes('first')) as string
  expect(line.indexOf('third')).toBeLessThan(line.indexOf('first'))
})

test('an undirected piped label draws no arrowhead', () => {
  const out = plain('graph TD\n A ---|maybe| B')
  expect(out).toContain('maybe')
  expect(out).not.toContain('▼')
})

test('chain edges are straight', () => {
  for (const line of lines('graph TD\n A[aaaa] --> B[b] --> C[cccccccc]')) {
    expect(line.includes('└') && line.includes('┐')).toBe(false)
  }
})

test('a bidirectional link draws both arrowheads', () => {
  const lr = plain('flowchart LR\n A <--> B')
  expect(lr.includes('◄') && lr.includes('▶')).toBe(true)
  const td = plain('graph TD\n A <--> B')
  expect(td.includes('▲') && td.includes('▼')).toBe(true)
})

test('a reversed arrow ranks the source above the target', () => {
  const out = plain('graph TD\n A <-- B')
  expect(rowOf(out, 'B')).toBeLessThan(rowOf(out, 'A'))
})

test('a skip edge routes around the intermediate boxes', () => {
  const out = plain('graph TD\n A --> B\n B --> C\n A --> C')
  expect(out).not.toContain('┼')
  expect(out).toContain('◄')
})

test('crossing edges render untangled', () => {
  const out = plain('graph TD\n C[ccc]\n D[ddd]\n A --> D\n B --> C')
  const row = out.split('\n').find((l) => l.includes('ccc') && l.includes('ddd')) as string
  expect(row.indexOf('ddd')).toBeLessThan(row.indexOf('ccc'))
  expect(out).not.toContain('┼')
})

test('an unavoidable crossing claims a separate bus row', () => {
  const crossing = plain('graph TD\n A --> D[ddd]\n A --> C[ccc]\n B --> C\n B --> D')
  const parallel = plain('graph TD\n A --> C[ccc]\n B --> D[ddd]')
  expect(crossing).toContain('┼')
  expect(crossing.split('\n').length).toBe(parallel.split('\n').length + 1)
  expect(countOf(crossing, '▼')).toBe(2)
})

test('a fan-out keeps a single bus row', () => {
  const out = plain('graph TD\n A --> C[ccc]\n A --> D[ddd]')
  const baseline = plain('graph TD\n A --> C[ccc]')
  expect(out.split('\n').length).toBe(baseline.split('\n').length)
  expect(out).not.toContain('┼')
})

test('back edges to one target share a lane', () => {
  const two = lines('graph TD\n A --> B\n B --> C\n B --> A\n C --> A')
  const one = lines('graph TD\n A --> B\n B --> C\n C --> A')
  const widest = (ls: string[]) => Math.max(...ls.map(stringWidth))
  expect(widest(two)).toBe(widest(one))
  expect(countOf(two.join('\n'), '◄')).toBe(1)
})

test('unrelated back edges claim separate lanes', () => {
  const split = lines('graph TD\n A --> B\n B --> C\n B --> A\n C --> B')
  const single = lines('graph TD\n A --> B\n B --> C\n C --> B')
  const widest = (ls: string[]) => Math.max(...ls.map(stringWidth))
  expect(countOf(split.join('\n'), '◄')).toBe(2)
  expect(widest(split)).toBeGreaterThan(widest(single))
})

test('fan-out renders one arrowhead per target', () => {
  expect(countOf(plain('graph TD\n A & B --> C & D'), '▼')).toBe(2)
})

test('a circle head is rendered', () => {
  expect(plain('graph TD\n A --o B')).toContain('o')
})

test('dotted and thick lines render distinctly', () => {
  expect(plain('graph TD\n A -.-> B')).toContain('╎')
  expect(plain('graph TD\n A ==> B')).toContain('┃')
  const solid = plain('graph TD\n A --> B')
  expect(solid.includes('╎') || solid.includes('┃')).toBe(false)
})

test('the dotted label form renders dashed', () => {
  const out = plain('graph LR\n A -. maybe .-> B')
  expect(out).toContain('╌')
  expect(out).toContain('maybe')
})

test('a thick jog uses thick corners', () => {
  const out = plain('graph TD\n A[aaaaaaa] ==> B\n A ==> C[ccccccc]')
  expect(out.includes('┏') || out.includes('┓') || out.includes('┳')).toBe(true)
})

test('a mixed solid and dotted bus stays light', () => {
  const out = plain('graph TD\n A --> C\n B -.-> C')
  expect(out).toContain('╌')
  expect(out).toContain('─')
  expect(out).toContain('┬')
})

test('box borders stay light next to styled edges', () => {
  const out = plain('graph TD\n A ==> B')
  expect(out.includes('┌') && out.includes('└')).toBe(true)
  expect(out).not.toContain('┏')
})

// -------------------------------------------------------------- self loops

test('a self loop renders below the box', () => {
  const out = plain('graph TD\n A --> A')
  expect(out.includes('╰') && out.includes('╯')).toBe(true)
  expect(out).toContain('▲')
})

test('a self loop label renders', () => {
  expect(plain('graph TD\n A -->|again| A')).toContain('again')
})

test('a self loop coexists with a forward edge', () => {
  const out = plain('graph TD\n A --> A\n A --> B')
  expect(out).toContain('▲')
  expect(out).toContain('▼')
  expect(out).toContain('B')
  expect(out).not.toContain('┼')
})

test('a self loop flips with BT', () => {
  const out = plain('flowchart BT\n A --> A\n A --> B')
  expect(out).toContain('▼')
  expect(out.includes('╭') || out.includes('╮')).toBe(true)
})

test('a self loop in LR', () => {
  const out = plain('flowchart LR\n A --> A\n A --> B')
  expect(out).toContain('▲')
  expect(out).toContain('▶')
})

// ------------------------------------------------------------- syntax errors

/** Art plus the source it silently dropped; throws if nothing was drawn. */
function warned(src: string): string[] {
  const art = render(src)
  if (art === null) throw new Error('render drew nothing')
  return art.warnings
}

test('a well-formed flowchart warns about nothing', () => {
  for (const src of [
    'graph TD\n A[Start] --> B[End]',
    'flowchart LR\n A[ok] --> B{decide} --> C((done))',
    'graph TD\n A -->|yes| B\n B -.-> C\n A ==> C',
    'graph TD\n S --> one\n subgraph one [Group]\n A --> B\n end',
  ]) {
    expect(`${src}: ${warned(src).join()}`).toBe(`${src}: `)
  }
})

test('an unterminated label is reported, not swallowed', () => {
  // Without the warning this reads as one node called `Start --> B`: the edge
  // the author wrote is gone and nothing says so.
  const art = render('graph TD\n A[Start --> B')
  if (art === null) throw new Error('render drew nothing')
  expect(art.warnings).toEqual(['node "A": label is missing its closing `]`'])
  expect(art.plain.join('\n')).toContain('Start --> B')
})

test('an unterminated quoted label is reported', () => {
  expect(warned('graph TD\n A["Start] --> B')[0]).toContain('missing its closing')
})

test('text after an unreadable link is reported', () => {
  expect(warned('graph TD\n A --> B\n total garbage here')).toEqual([
    'dropped, expected a link: "garbage here"',
  ])
})

test('a link with no target is reported', () => {
  expect(warned('graph TD\n A -->')).toEqual(['dropped, link has no target: "A -->"'])
})

test('a statement that is not a node at all is reported', () => {
  expect(warned('graph TD\n A --> B\n -->')).toEqual(['dropped, does not start with a node: "-->"'])
})

test('the known entity limit explains itself in warnings', () => {
  // `;` inside an unquoted label splits the statement mid-entity — see CODE.md.
  const w = warned('graph TD\n A -->|go&#160;| B')
  expect(w.length).toBe(2)
  expect(w[0]).toContain('link has no target')
})

test('the strict grammars give up only one line before failing', () => {
  // One unreadable trailing line is dropped and reported; two means the
  // salvage retry lands on a source that still does not parse.
  expect(warned('stateDiagram-v2\n A --> B\n bad line here').length).toBe(1)
  expect(render('stateDiagram-v2\n bad one here\n bad two here')).toBeNull()
})

test('the salvage retry ignores trailing whitespace', () => {
  expect(warned('stateDiagram-v2\n A --> B\n some garbage line\n')).toEqual([
    'dropped, unreadable final line: "some garbage line"',
  ])
})

test('diagramKind separates an unsupported type from a malformed one', () => {
  // Both render to null; only one is worth telling the author to fix.
  const malformed = 'stateDiagram-v2\n bad one here\n bad two here'
  expect(render(malformed)).toBeNull()
  expect(diagramKind(malformed)).toBe('state')

  const unsupported = 'gantt\n title Plan'
  expect(render(unsupported)).toBeNull()
  expect(diagramKind(unsupported)).toBeNull()
})

/** How many times the display would change between art and source box. */
function flips(src: string, frame: (prefix: string) => boolean): number {
  const seen: boolean[] = []
  for (let n = 4; n < src.length; n += 4) seen.push(frame(src.slice(0, n)))
  seen.push(frame(src))
  return seen.filter((v, i) => i > 0 && v !== seen[i - 1]).length
}

const STREAMED = `flowchart TD
  A[User submits login form] --> B{Credentials valid?}
  B -->|yes| C[Issue JWT access token]
  B -->|no| D[Return 401 Unauthorized]
  C --> E[Set refresh cookie]`

test('a streaming flowchart never stops being drawable', () => {
  // One transition, box -> art, and never back: a diagram that alternates with
  // the source box as it streams is the thing warnings must not cause.
  expect(flips(STREAMED, (s) => render(s) !== null)).toBe(1)
})

test('gating on warnings is what makes a streaming diagram flicker', () => {
  // Not a recommendation — a guard on the advice in the docs. Warnings fire at
  // most intermediate states, so gating on them is unusable while streaming.
  const gated = flips(STREAMED, (s) => {
    const a = render(s)
    return a !== null && a.warnings.length === 0
  })
  expect(gated).toBeGreaterThan(5)
})

test('a streaming strict grammar never stops being drawable', () => {
  // The salvage retry is what buys this: without it the half-written last
  // statement fails the whole parse on most frames.
  const src = `sequenceDiagram
  participant U as User
  participant W as Web App
  U->>W: Submit login
  W-->>U: Set session cookie`
  expect(flips(src, (s) => render(s) !== null)).toBe(1)
})

test('diagramKind reads the header without parsing the body', () => {
  expect(diagramKind('graph TD\n A --> B')).toBe('flowchart')
  expect(diagramKind('flowchart LR')).toBe('flowchart')
  expect(diagramKind('classDiagram')).toBe('class')
  expect(diagramKind('erDiagram')).toBe('er')
  expect(diagramKind('sequenceDiagram')).toBe('sequence')
  expect(diagramKind('pie title x')).toBeNull()
  expect(diagramKind('')).toBeNull()
})

// --------------------------------------------------------------- source box

test('an unsupported diagram draws nothing', () => {
  expect(render('gantt\n title Plan\n section A\n task :a1, 2024-01-01, 30d')).toBeNull()
})

test('the source box carries no warnings', () => {
  expect(sourceBox('gantt\n title Plan', 80).warnings).toEqual([])
})

test('an adversarial chain is over the cell cap', () => {
  let src = 'graph TD\n'
  for (let i = 0; i < 10_000; i++) src += ` N${i} --> N${i + 1}\n`
  expect(render(src)).toBeNull()
})

test('a single-statement chain over the cap draws nothing', () => {
  let src = 'graph LR\n '
  for (let i = 0; i < 10_000; i++) src += `N${i}-->`
  expect(render(`${src}N10000`)).toBeNull()
})

test('a deep chain within the caps renders', () => {
  let src = 'graph TD\n'
  for (let i = 0; i < 100; i++) src += ` N${i} --> N${i + 1}\n`
  const out = plain(src)
  expect(out).toContain('N0')
  expect(out).toContain('N100')
  expect(out).toContain('▼')
})

test('source box styled and plain widths match', () => {
  const art = sourceBox('gantt\n title Plan\n a\n', 120)
  expect(art.styled.length).toBe(art.plain.length)
  art.plain.forEach((row, i) => {
    const styledW = art.styled[i].reduce((s, span) => s + stringWidth(span.text), 0)
    expect(styledW).toBe(stringWidth(row))
    expect(stringWidth(row)).toBe(art.width)
  })
})

test('the source box frames the source under a titled header', () => {
  const art = sourceBox('gantt\n title Plan\n section A', 120)
  expect(art.plain[0]).toContain('mermaid: gantt')
  expect(art.plain.join('\n')).toContain('Plan')
  expect(art.plain[art.plain.length - 1]).toStartWith('╰')
})

test('an over-wide diagram still renders and reports its width', () => {
  const src =
    'flowchart LR\n A[aaaaaaaaaaaaaaaaaaaa] --> B[bbbbbbbbbbbbbbbbbbbb] --> C[cccccccccccccccccccc]'
  const art = render(src)
  if (art === null) throw new Error('render drew nothing')
  expect(art.width).toBeGreaterThan(40)
  expect(art.plain.join('\n')).toContain('▶')
  // The caller's escape hatch, bounded by the source it frames.
  const box = sourceBox(src, 40)
  expect(box.plain.join('\n')).toContain('mermaid: flowchart')
  expect(box.width).toBeLessThanOrEqual(src.length)
})

test('reported width is the widest painted row', () => {
  const art = render('flowchart LR\n A[Start] --> B[End]')
  if (art === null) throw new Error('render drew nothing')
  expect(art.width).toBe(Math.max(...art.plain.map(stringWidth)))
})

test('the source box wraps long lines to maxWidth', () => {
  const out = sourceBox(
    'gantt\n title a very long line that should wrap inside the source box nicely',
    40,
  ).plain
  expect(out.every((l) => stringWidth(l) <= 40)).toBe(true)
  for (const line of out.slice(1, -1)) {
    expect(line.startsWith('│') && line.endsWith('│')).toBe(true)
  }
  expect(out.join('\n')).toContain('nicely')
})

test('entity-escaped labels decode in the box art', () => {
  const src =
    'flowchart LR\n  YAML["models-config/&lt;model&gt;/&lt;env&gt;.yaml\\nenterprise_api_config:"]\n  PY["model_config_map.py\\nlanguage_model_dict_to_proto()"]\n  YAML --> PY'
  const art = plain(src)
  expect(art.includes('<model>') && art.includes('<env>')).toBe(true)
  expect(art.includes('&lt;') || art.includes('&gt;')).toBe(false)
})

test('a diagram with html labels renders without tag artifacts', () => {
  const out = plain(
    'flowchart TD\n  IDs["<b>3. Token IDs</b><br/>[ 464, 3797 ]<br/><i>indices</i>"] --> Out["<b>done</b>"]',
  )
  expect(out).not.toContain('<b>')
  expect(out).not.toContain('</')
  expect(out).not.toContain('br/')
  expect(out).toContain('Token IDs')
})

// ------------------------------------------------------------------- class

test('a class diagram renders compartments', () => {
  const out = plain(
    'classDiagram\n class Animal {\n +int age\n +isMammal() bool\n }\n Animal <|-- Duck',
  )
  expect(out).toContain('Animal')
  expect(out).toContain('+int age')
  expect(out).toContain('+isMammal() bool')
  expect(out.includes('├') && out.includes('┤')).toBe(true)
  expect(rowOf(out, 'Animal')).toBeLessThan(rowOf(out, '+int age'))
  expect(rowOf(out, '+int age')).toBeLessThan(rowOf(out, '+isMammal() bool'))
})

test('inheritance puts the triangle at the parent', () => {
  const out = plain('classDiagram\n Animal <|-- Duck\n Animal <|-- Fish')
  expect(out).toContain('△')
  const animal = rowOf(out, 'Animal')
  const duck = rowOf(out, 'Duck')
  expect(animal).toBeLessThan(duck)
  const tri = rowOf(out, '△')
  expect(tri).toBeGreaterThanOrEqual(animal)
  expect(tri).toBeLessThan(duck)
})

test('class realization renders dotted', () => {
  const out = plain('classDiagram\n IShape <|.. Circle')
  expect(out.includes('╎') || out.includes('╌')).toBe(true)
})

test('composition and aggregation render diamonds', () => {
  const out = plain('classDiagram\n Car *-- Engine\n Pond o-- Duck')
  expect(out).toContain('◆')
  expect(out).toContain('◇')
})

test('colon members merge with a class block', () => {
  const out = plain(
    'classDiagram\n class Duck {\n +swim()\n }\n Duck : +String beakColor\n S --> Duck',
  )
  expect(out).toContain('+swim()')
  expect(out).toContain('+String beakColor')
})

test('a class annotation renders guillemets', () => {
  expect(plain('classDiagram\n <<interface>> Shape\n Shape <|.. Circle')).toContain('«interface»')
})

test('class generics display as angle brackets', () => {
  const out = plain('classDiagram\n Shape~T~ : +area() T\n S --> Shape~T~')
  expect(out).toContain('Shape<T>')
  expect(out).not.toContain('~')
})

test('class cardinalities fold into the edge label', () => {
  expect(plain('classDiagram\n Student "many" --> "1" School : attends')).toContain(
    'many attends 1',
  )
})

test('a from-end head survives a fan-out jog', () => {
  const out = plain('classDiagram\n Animal <|-- Duck\n Animal <|-- Fish\n Animal <|-- Cow')
  expect(countOf(out, '△') + countOf(out, '▽')).toBe(1)
})

test('an empty class is a plain titled box', () => {
  expect(plain('classDiagram\n class Loner\n A --> Loner')).toContain('Loner')
})

test('an unknown class statement is dropped, not fatal', () => {
  expect(warned('classDiagram\n A --> B\n total garbage here')).toEqual([
    'dropped, unreadable final line: "total garbage here"',
  ])
})

test('class members elide past the cap', () => {
  let src = 'classDiagram\n class Big {\n'
  for (let i = 0; i < 12; i++) src += ` +field${i}\n`
  const out = plain(`${src} }\n A --> Big`)
  expect(out).toContain('+field7')
  expect(out).not.toContain('+field9')
  expect(out).toContain('…')
})

test('class direction LR puts related classes on one row', () => {
  const out = plain('classDiagram\n direction LR\n A --> B')
  const line = out.split('\n').find((l) => l.includes('A')) as string
  expect(line).toContain('B')
})

// ---------------------------------------------------------------------- ER

test('an ER diagram renders entities and relationship labels', () => {
  const out = plain(
    'erDiagram\n CUSTOMER ||--o{ ORDER : places\n CUSTOMER {\n string name PK "full name"\n int custNumber\n }',
  )
  expect(out).toContain('CUSTOMER')
  expect(out).toContain('ORDER')
  expect(out).toContain('string name PK')
  expect(out).not.toContain('full name')
  expect(out).toContain('1 places 0..*')
  expect(out).toContain('├')
})

test('a non-identifying ER relationship renders dotted', () => {
  const out = plain('erDiagram\n A ||..o{ B : uses')
  expect(out.includes('╎') || out.includes('╌')).toBe(true)
})

test('ER relationships have no arrowheads', () => {
  const out = plain('erDiagram\n A ||--o{ B : has')
  for (const head of ['▼', '▲', '◄', '▶', '△', '◆', '◇']) expect(out).not.toContain(head)
})

// Upstream's equivalent asserts the labels appear, but it reads the fallback
// box, which merely echoes the source. Neither grammar accepts the alias form.
test('an ER entity alias is not parsed', () => {
  expect(render('erDiagram\n p[Person] ||--o{ a["Bank Account"] : owns')).toBeNull()
})

test('a bare ER entity declaration renders', () => {
  const out = plain('erDiagram\n LONER\n A ||--|| B : linked')
  expect(out).toContain('LONER')
  expect(out).toContain('1 linked 1')
})

test('ER attributes elide past the cap', () => {
  let src = 'erDiagram\n BIG {\n'
  for (let i = 0; i < 12; i++) src += ` int f${i}\n`
  const out = plain(`${src} }\n BIG ||--|| OTHER : x`)
  expect(out).toContain('int f7')
  expect(out).not.toContain('int f9')
  expect(out).toContain('…')
})

test('an unknown ER statement is dropped, not fatal', () => {
  expect(warned('erDiagram\n A ||--|| B : ok\n utter nonsense statement')).toEqual([
    'dropped, unreadable final line: "utter nonsense statement"',
  ])
})

// --------------------------------------------------------------- subgraphs

test('a subgraph renders a titled frame', () => {
  const out = plain(
    'graph TD\n S[Start] --> one\n subgraph one [Group One]\n A --> B\n end\n one --> E[End]',
  )
  expect(out).toContain(' Group One ')
  const frameClose = out
    .split('\n')
    .reduce((acc, l, i) => (l.trimStart().startsWith('└') ? i : acc), -1)
  expect(rowOf(out, 'Group One')).toBeLessThan(rowOf(out, '│ A │'))
  expect(rowOf(out, '│ A │')).toBeLessThan(rowOf(out, '│ B │'))
  expect(rowOf(out, '│ B │')).toBeLessThanOrEqual(frameClose)
  expect(out.includes('Start') && out.includes('End')).toBe(true)
  expect(countOf(out, '▼')).toBe(3)
})

test('an edge between two subgraphs ranks their frames', () => {
  const out = plain(
    'graph TD\n subgraph api [API]\n A1 --> A2\n end\n subgraph db [Storage]\n B1\n end\n api --> db',
  )
  expect(out).toContain(' API ')
  expect(out).toContain(' Storage ')
  expect(rowOf(out, 'API')).toBeLessThan(rowOf(out, 'Storage'))
})

test('subgraphs nest', () => {
  const out = plain(
    'graph TD\n subgraph outer [Outer]\n subgraph inner [Inner]\n X --> Y\n end\n W --> X\n end\n S --> outer',
  )
  expect(out).toContain(' Outer ')
  expect(out).toContain(' Inner ')
  expect(rowOf(out, 'Outer')).toBeLessThan(rowOf(out, 'Inner'))
})

test('a cross-member edge attaches to the frame', () => {
  const out = plain('graph LR\n S --> A\n subgraph g [Workers]\n A --> B\n end\n B --> T')
  expect(out).toContain(' Workers ')
  expect(out.includes('S') && out.includes('T')).toBe(true)
  expect(countOf(out, '▶')).toBe(3)
  const row = out.split('\n').find((l) => l.includes('│ A ├')) as string
  expect(row.indexOf('S')).toBeLessThan(row.indexOf('A'))
})

test('a subgraph id referenced before declaration titles the frame', () => {
  const out = plain('graph TD\n X --> two\n subgraph two\n C --> D\n end')
  expect(out).toContain(' two ')
  expect(out).toContain('│ C │')
})

test('quoted and plain subgraph titles', () => {
  expect(plain('graph TD\n subgraph "My Stuff"\n A\n end\n S --> A')).toContain(' My Stuff ')
  expect(plain('graph TD\n subgraph batch jobs\n B\n end\n S --> B')).toContain(' batch jobs ')
  const out3 = plain('graph TD\n subgraph "a &lt;b&gt;"\n C\n end\n S --> C')
  expect(out3).toContain('a <b>')
  expect(out3).not.toContain('&lt;')
})

test('an empty subgraph is dropped', () => {
  const out = plain('graph TD\n subgraph ghost\n end\n A --> B')
  expect(out).not.toContain('ghost')
  expect(out).toContain('▼')
})

test('BT flips a frame and its contents', () => {
  const out = plain('flowchart BT\n S --> one\n subgraph one [Up]\n A --> B\n end')
  expect(out).toContain(' Up ')
  expect(rowOf(out, '│ B │')).toBeLessThan(rowOf(out, '│ A │'))
  expect(rowOf(out, ' Up ')).toBeLessThan(rowOf(out, 'S'))
  expect(out).toContain('▲')
})

test('subgraph depth over the cap draws nothing', () => {
  let src = 'graph TD\n'
  for (let i = 0; i < 8; i++) src += ` subgraph g${i}\n`
  src += ' A --> B\n'
  for (let i = 0; i < 8; i++) src += ' end\n'
  expect(render(src)).toBeNull()
})

// ------------------------------------------------------------------- state

test('a state diagram renders states and transitions', () => {
  const out = plain('stateDiagram-v2\n [*] --> Idle\n Idle --> Running: start\n Running --> [*]')
  expect(out).toContain('Idle')
  expect(out).toContain('Running')
  expect(out).toContain('start')
  expect(out).toContain('▼')
  expect(countOf(out, '●')).toBe(2)
  const rows = out.split('\n')
  const firstDot = rows.findIndex((l) => l.includes('●'))
  const lastDot = rows.reduce((acc, l, i) => (l.includes('●') ? i : acc), -1)
  const idle = rowOf(out, 'Idle')
  expect(firstDot).toBeLessThan(idle)
  expect(idle).toBeLessThan(lastDot)
})

test('the v1 state header renders', () => {
  expect(plain('stateDiagram\n A --> B')).toContain('▼')
})

test('state boxes are rounded', () => {
  const out = plain('stateDiagram-v2\n A --> B')
  expect(out).toContain('╭')
  expect(out).not.toContain('┌')
})

test('a state alias label renders', () => {
  expect(plain('stateDiagram-v2\n state "Waiting for input" as W\n W --> Done')).toContain(
    'Waiting for input',
  )
})

test('a state description sets the label', () => {
  expect(plain('stateDiagram-v2\n s2 : waits patiently\n A --> s2')).toContain('waits patiently')
})

test('state direction LR stays flat', () => {
  const out = plain('stateDiagram-v2\n direction LR\n A --> B --> C')
  const td = plain('stateDiagram-v2\n A --> B')
  expect(out.split('\n').length).toBeLessThanOrEqual(td.split('\n').length + 2)
  const line = out.split('\n').find((l) => l.includes('A')) as string
  expect(line).toContain('B')
})

test('composite state contents render flat', () => {
  const out = plain('stateDiagram-v2\n state Active {\n A --> B\n }\n Active --> Done')
  expect(out).toContain('Active')
  expect(out.includes('A') && out.includes('B')).toBe(true)
  expect(out).toContain('Done')
})

test('state notes are skipped', () => {
  const out = plain(
    'stateDiagram-v2\n A --> B\n note right of A: inline note\n note left of B\n block text\n end note',
  )
  expect(out).toContain('▼')
  expect(out).not.toContain('note')
  expect(out).not.toContain('block text')
})

test('a state back transition uses a lane', () => {
  const out = plain('stateDiagram-v2\n A --> B\n B --> C\n C --> B: retry')
  expect(out).toContain('◄')
  expect(out).toContain('retry')
})

test('an unknown state statement is dropped, not fatal', () => {
  expect(warned('stateDiagram-v2\n A --> B\n some garbage line')).toEqual([
    'dropped, unreadable final line: "some garbage line"',
  ])
})

test('a state diagram over the cap draws nothing', () => {
  let src = 'stateDiagram-v2\n'
  for (let i = 0; i < 600; i++) src += ` S${i} --> S${i + 1}\n`
  expect(render(src)).toBeNull()
})

test('a state chain with markers and a label renders', () => {
  const out = plain('stateDiagram-v2\n [*] --> A --> B: done')
  expect(out).toContain('●')
  expect(out).toContain('done')
})

test('a dangling state chain draws nothing', () => {
  expect(render('stateDiagram-v2\n A --> B -->')).toBeNull()
})

// ---------------------------------------------------------------- sequence

test('a sequence diagram renders actors and messages', () => {
  const out = plain('sequenceDiagram\n Alice->>Bob: Hello Bob\n Bob-->>Alice: Hi Alice')
  expect(out).toContain('Alice')
  expect(out).toContain('Bob')
  expect(out).toContain('Hello Bob')
  expect(out).toContain('▶')
  expect(out).toContain('◄')
  expect(out).toContain('╌')
  expect(countOf(out, '│ Alice │')).toBe(2)
})

test('a participant alias label renders', () => {
  const out = plain(
    'sequenceDiagram\n participant C as Client\n participant S as Server\n C->>S: GET /',
  )
  expect(out).toContain('Client')
  expect(out).toContain('Server')
})

test('declared participant order wins', () => {
  const out = plain('sequenceDiagram\n participant B\n participant A\n A->>B: hi')
  const line = out.split('\n')[1]
  expect(line.indexOf('B')).toBeLessThan(line.indexOf('A'))
})

test('a self message loops', () => {
  const out = plain('sequenceDiagram\n A->>A: think')
  expect(out).toContain('╮')
  expect(out).toContain('╯')
  expect(out).toContain('think')
})

test('a cross head renders', () => {
  expect(plain('sequenceDiagram\n A-x B: lost')).toContain('×')
})

test('a note over renders a box', () => {
  expect(plain('sequenceDiagram\n A->>B: hi\n Note over A,B: happy path')).toContain('happy path')
})

test('autonumber prefixes messages', () => {
  const out = plain('sequenceDiagram\n autonumber\n A->>B: one\n B->>A: two')
  expect(out).toContain('1. one')
  expect(out).toContain('2. two')
})

test('a loop renders a divider and an end', () => {
  const out = plain('sequenceDiagram\n A->>B: hi\n loop retry x3\n A->>B: again\n end')
  expect(out).toContain('loop retry x3')
  expect(out).toContain(' end ')
})

test('a rect block is invisible', () => {
  const out = plain('sequenceDiagram\n rect rgb(0,0,0)\n A->>B: hi\n end')
  expect(out).not.toContain('rect')
  expect(out).not.toContain(' end ')
})

test('a box end does not close the enclosing block', () => {
  const out = plain(
    'sequenceDiagram\n loop l1\n box g\n participant A\n end\n A->>B: hi\n A->>B: bye\n end',
  )
  expect(countOf(out, ' end ')).toBe(1)
  expect(rowOf(out, 'loop l1')).toBeLessThan(rowOf(out, 'hi'))
  expect(rowOf(out, 'bye')).toBeLessThan(rowOf(out, ' end '))
  expect(out).not.toContain('box')
})

test('critical and option render dividers', () => {
  const out = plain(
    'sequenceDiagram\n critical connect\n A->>B: try\n option timeout\n A->>A: log\n end',
  )
  expect(out).toContain('critical connect')
  expect(out).toContain('option timeout')
  expect(out).toContain(' end ')
})

test('a long message label widens the gap', () => {
  expect(
    plain('sequenceDiagram\n A->>B: a very long message label that needs room\n B-->>A: ok'),
  ).toContain('a very long message label that needs room')
})

test('an unparseable arrow draws nothing', () => {
  expect(render('sequenceDiagram\n ->>B: orphan')).toBeNull()
})

test('an unknown sequence statement is dropped, not fatal', () => {
  expect(warned('sequenceDiagram\n A->>B: hi\n garbage statement here')).toEqual([
    'dropped, unreadable final line: "garbage statement here"',
  ])
})

test('a wide sequence diagram renders and reports its width', () => {
  const art = render('sequenceDiagram\n A->>B: this label is far wider than the available pane')
  if (art === null) throw new Error('render drew nothing')
  expect(art.width).toBeGreaterThan(30)
})

test('a sequence diagram over the cap draws nothing', () => {
  let src = 'sequenceDiagram\n'
  for (let i = 0; i < 600; i++) src += ` A->>B: msg ${i}\n`
  expect(render(src)).toBeNull()
})

test('activation markers are stripped', () => {
  const out = plain('sequenceDiagram\n A->>+B: call\n B-->>-A: return')
  expect(out).toContain('call')
  expect(out).toContain('return')
  expect(out).not.toContain('+')
})

test('sequence rows are sentinel free', () => {
  const out = plain('sequenceDiagram\n Alice->>Bob: hi\n Note over Alice: solo note')
  expect(out).not.toContain(CONT)
  expect(out).toContain('solo note')
})

const ESC = String.fromCharCode(27)

test('control characters never reach the output', () => {
  for (const src of [`graph TD\n A[x${CONT}y] --> B`, `graph TD\n A[${ESC}[31mRED] --> B`]) {
    const out = plain(src)
    expect(out).not.toContain(CONT)
    expect(out).not.toContain(ESC)
  }
})

// `sourceBox` echoes whatever it is handed, so it is the second door untrusted
// source arrives by and has to strip the same characters `render` does.
test('the source box strips control characters', () => {
  const src = `gantt\n title ${ESC}]8;;http://example${String.fromCharCode(7)}link`
  const out = sourceBox(src, 80).plain.join('\n')
  expect(out).not.toContain(ESC)
  expect(out).not.toContain(String.fromCharCode(7))
  expect(out).toContain('link')
})

// A control character measures one column and paints none, so a box sized around
// one comes out a column short. NUL is worst: it is the CONT sentinel, so the row
// builder drops it after layout has already reserved its cell.
test('a control character in a label does not shrink its box', () => {
  const ls = lines(`graph TD\n A[x${CONT}y] --> B`)
  expect(ls[0]).toBe('┌────┐')
  expect(stringWidth(ls[1])).toBe(stringWidth(ls[0]))
})

test('a source of only control characters is blank', () => {
  expect(render(`${CONT}${ESC}`)).toBeNull()
})
