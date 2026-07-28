import { expect, test } from 'bun:test'
import { CONT } from '../src/canvas.ts'
import { render } from '../src/index.ts'
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

test('LR is shorter than TD for a chain', () => {
  const chain = 'A --> B --> C --> D'
  const td = lines(`graph TD\n ${chain}`).length
  const lr = lines(`flowchart LR\n ${chain}`).length
  expect(lr).toBeLessThan(td)
})

test('blank source returns null', () => {
  expect(render('   \n  ', { maxWidth: 80 })).toBeNull()
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

// ---------------------------------------------------------------- fallback

test('an unsupported diagram uses the fallback box', () => {
  const out = plain('gantt\n title Plan\n section A\n task :a1, 2024-01-01, 30d')
  expect(out).toContain('mermaid: gantt')
  expect(out).toContain('Plan')
})

test('an adversarial chain falls back', () => {
  let src = 'graph TD\n'
  for (let i = 0; i < 10_000; i++) src += ` N${i} --> N${i + 1}\n`
  expect(plain(src)).toContain('mermaid: graph')
})

test('a single-statement chain over the cap falls back', () => {
  let src = 'graph LR\n '
  for (let i = 0; i < 10_000; i++) src += `N${i}-->`
  expect(plain(`${src}N10000`)).toContain('mermaid: graph')
})

test('a deep chain within the caps renders', () => {
  let src = 'graph TD\n'
  for (let i = 0; i < 100; i++) src += ` N${i} --> N${i + 1}\n`
  const out = plain(src, 200)
  expect(out).toContain('N0')
  expect(out).toContain('N100')
  expect(out).toContain('▼')
})

test('fallback styled and plain widths match', () => {
  const art = render('gantt\n title Plan\n a\n', { maxWidth: 120 })
  if (art === null) throw new Error('render returned null')
  expect(art.styled.length).toBe(art.plain.length)
  const frameW = stringWidth(art.plain[0])
  art.plain.forEach((row, i) => {
    const styledW = art.styled[i].reduce((s, span) => s + stringWidth(span.text), 0)
    expect(styledW).toBe(stringWidth(row))
    expect(stringWidth(row)).toBe(frameW)
  })
})

test('an over-wide diagram falls back', () => {
  const src =
    'flowchart LR\n A[aaaaaaaaaaaaaaaaaaaa] --> B[bbbbbbbbbbbbbbbbbbbb] --> C[cccccccccccccccccccc]'
  const out = lines(src, 40)
  expect(out.join('\n')).toContain('mermaid: flowchart')
  expect(Math.max(...out.map(stringWidth))).toBeLessThanOrEqual(src.length)
  expect(lines(src, 120).some((l) => l.includes('▶'))).toBe(true)
})

test('a too-wide fallback appends the hint below the box', () => {
  const src =
    'flowchart LR\n A[aaaaaaaaaaaaaaaaaaaa] --> B[bbbbbbbbbbbbbbbbbbbb] --> C[cccccccccccccccccccc]'
  const out = lines(src, 40)
  const joined = out.join('\n')

  expect(joined).toContain('mermaid: flowchart')
  expect(joined).not.toContain('(too wide)')
  expect(joined).toContain('flowchart LR')
  expect(rowOf(joined, 'too wide')).toBeGreaterThan(rowOf(joined, '╰'))
  expect(joined).toContain('open the image')
  expect(out.every((l) => stringWidth(l) <= 40)).toBe(true)
})

test('an unsupported type is not flagged too wide', () => {
  const out = plain('gantt\n title Plan\n section A\n task :a1, 2024-01-01, 30d')
  expect(out).toContain('mermaid: gantt')
  expect(out).not.toContain('too wide')
})

test('a fitting diagram has no width warning', () => {
  const out = plain('flowchart LR\n A[Start] --> B[End]')
  expect(out).not.toContain('too wide')
  expect(out).not.toContain('mermaid: flowchart')
  expect(out).toContain('▶')
})

test('the fallback wraps long lines to maxWidth', () => {
  const out = lines(
    'gantt\n title a very long line that should wrap inside the fallback box nicely',
    40,
  )
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

test('an unknown class statement falls back', () => {
  expect(plain('classDiagram\n A --> B\n total garbage here')).toContain('mermaid: classDiagram')
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

test('an ER entity alias label renders', () => {
  const out = plain('erDiagram\n p[Person] ||--o{ a["Bank Account"] : owns')
  expect(out).toContain('Person')
  expect(out).toContain('Bank Account')
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

test('an unknown ER statement falls back', () => {
  expect(plain('erDiagram\n A ||--|| B : ok\n utter nonsense statement')).toContain(
    'mermaid: erDiagram',
  )
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

test('subgraph depth over the cap falls back', () => {
  let src = 'graph TD\n'
  for (let i = 0; i < 8; i++) src += ` subgraph g${i}\n`
  src += ' A --> B\n'
  for (let i = 0; i < 8; i++) src += ' end\n'
  expect(plain(src)).toContain('mermaid: graph')
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

test('an unknown state statement falls back', () => {
  expect(plain('stateDiagram-v2\n A --> B\n some garbage line')).toContain(
    'mermaid: stateDiagram-v2',
  )
})

test('a state diagram over the cap falls back', () => {
  let src = 'stateDiagram-v2\n'
  for (let i = 0; i < 600; i++) src += ` S${i} --> S${i + 1}\n`
  expect(plain(src)).toContain('mermaid: stateDiagram-v2')
})

test('a state chain with markers and a label renders', () => {
  const out = plain('stateDiagram-v2\n [*] --> A --> B: done')
  expect(out).toContain('●')
  expect(out).toContain('done')
})

test('a dangling state chain falls back', () => {
  expect(plain('stateDiagram-v2\n A --> B -->')).toContain('mermaid: stateDiagram-v2')
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

test('an unparseable arrow falls back', () => {
  expect(plain('sequenceDiagram\n ->>B: orphan')).toContain('mermaid: sequenceDiagram')
})

test('an unknown sequence statement falls back', () => {
  expect(plain('sequenceDiagram\n A->>B: hi\n garbage statement here')).toContain(
    'mermaid: sequenceDiagram',
  )
})

test('an over-wide sequence diagram falls back', () => {
  expect(
    plain('sequenceDiagram\n A->>B: this label is far wider than the available pane width', 30),
  ).toContain('mermaid: sequenceDiagram')
})

test('a sequence diagram over the cap falls back', () => {
  let src = 'sequenceDiagram\n'
  for (let i = 0; i < 600; i++) src += ` A->>B: msg ${i}\n`
  expect(plain(src)).toContain('mermaid: sequenceDiagram')
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
  for (const src of [
    `graph TD\n A[x${CONT}y] --> B`,
    `graph TD\n A[${ESC}[31mRED] --> B`,
    `gantt\n title ${ESC}]8;;http://example${String.fromCharCode(7)}link`,
  ]) {
    const out = plain(src)
    expect(out).not.toContain(CONT)
    expect(out).not.toContain(ESC)
  }
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
  expect(render(`${CONT}${ESC}`, { maxWidth: 80 })).toBeNull()
})
