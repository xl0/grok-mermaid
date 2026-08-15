import { expect, test } from 'bun:test'
import { Canvas, drawText } from '../src/canvas.ts'
import { contrastOn, render, resolveClassStyle, sourceBox, toAnsi } from '../src/index.ts'
import type { MermaidArt } from '../src/types.ts'
import { stringWidth } from '../src/width.ts'

const DIAGRAMS: [string, string][] = [
  ['flowchart', 'graph TD\n A[Start] -->|go| B[End]\n B --> A'],
  ['flowchart LR', 'flowchart LR\n A --> B --> C'],
  ['flowchart BT', 'flowchart BT\n A[first] --> B[second]'],
  ['flowchart RL', 'flowchart RL\n A[first] --> B[second]'],
  ['wide glyphs', 'graph TD\n A[日本語ab] --> B[x]'],
  ['self loop', 'graph TD\n A -->|again| A\n A --> B'],
  ['subgraph', 'graph TD\n S --> one\n subgraph one [Group]\n A --> B\n end'],
  ['state', 'stateDiagram-v2\n [*] --> Idle\n Idle --> Run: start\n Run --> [*]'],
  ['class', 'classDiagram\n class Animal {\n +int age\n +run()\n }\n Animal <|-- Duck'],
  ['er', 'erDiagram\n CUSTOMER ||--o{ ORDER : places\n CUSTOMER {\n string name\n }'],
  ['sequence', 'sequenceDiagram\n A->>B: hi\n loop x\n B-->>A: ok\n end\n Note over A,B: n'],
  ['wide', 'flowchart LR\n A[aaaaaaaaaaaaaaaaaaaa] --> B[bbbbbbbbbbbbbbbbbbbb]'],
  ['pie', 'pie title Pets\n "Dogs" : 3\n "Cats" : 1'],
  ['mindmap', 'mindmap\n  root((App))\n    UI\n      Theme\n    DB'],
  ['timeline', 'timeline\n title T\n section S\n 2023 : one : two'],
  [
    'gitgraph',
    'gitGraph\n commit id: "a"\n branch dev\n commit id: "b"\n checkout main\n merge dev',
  ],
]

/** Both public producers of art; the span contract covers each equally. */
const CORPUS: [string, MermaidArt][] = [
  ...DIAGRAMS.map(([name, src]): [string, MermaidArt] => {
    const art = render(src)
    if (art === null) throw new Error(`${name}: render drew nothing`)
    return [name, art]
  }),
  ['source box', sourceBox('gantt\n title Plan\n section A\n task :a1, 2024-01-01, 30d', 40)],
]

const ESC = String.fromCharCode(27)

test('every styled row reconstructs its plain row exactly', () => {
  for (const [name, art] of CORPUS) {
    expect(art.styled.length).toBe(art.plain.length)
    art.plain.forEach((row, i) => {
      const joined = art.styled[i].map((s) => s.text).join('')
      expect(`${name}: ${joined}`).toBe(`${name}: ${row}`)
    })
  }
})

test('reported width matches the widest painted row', () => {
  for (const [name, art] of CORPUS) {
    const widest = Math.max(...art.plain.map(stringWidth))
    expect(`${name}: ${art.width}`).toBe(`${name}: ${widest}`)
  }
})

test('art has no leading or trailing empty rows', () => {
  for (const [name, art] of CORPUS) {
    expect(`${name}: ${art.plain[0]}`).not.toBe(`${name}: `)
    expect(`${name}: ${art.plain.at(-1)}`).not.toBe(`${name}: `)
  }
})

// Only ASCII spaces are blank filler. Trimming `\s` would drop a trailing NBSP
// from `plain` while `styled` kept it — no label reaches that today, but the
// invariant is what the whole span contract rests on.
test('a row ending in non-ASCII whitespace still reconstructs', () => {
  const canvas = new Canvas(6, 1)
  drawText(canvas, 'ab ', 0, 0, 'text')
  const { plain, styled } = canvas.toLines()
  expect(styled[0].map((s) => s.text).join('')).toBe(plain[0])
  expect(plain[0]).toBe('ab ')
})

test('adjacent spans never repeat a class', () => {
  for (const [name, art] of CORPUS) {
    for (const row of art.styled) {
      for (let i = 1; i < row.length; i++) {
        expect(`${name}: ${row[i].role}`).not.toBe(`${name}: ${row[i - 1].role}`)
      }
    }
  }
})

test('a box outline is a single border span', () => {
  const art = render('graph TD\n A[Start] --> B[End]')
  if (art === null) throw new Error('render drew nothing')
  const top = art.styled[art.plain.findIndex((l) => l.includes('┌'))]
  expect(top.filter((s) => s.role !== 'none')).toEqual([{ text: '┌───────┐', role: 'border' }])
})

test('toAnsi leaves text intact when the theme is empty', () => {
  const art = render('graph TD\n A --> B')
  if (art === null) throw new Error('render drew nothing')
  expect(toAnsi(art, {})).toEqual(art.plain)
})

test('toAnsi wraps styled runs in SGR sequences', () => {
  const art = render('graph TD\n A --> B')
  if (art === null) throw new Error('render drew nothing')
  const out = toAnsi(art, { border: '2' }).join('\n')
  expect(out).toContain(`${ESC}[2m`)
  expect(out).toContain(`${ESC}[0m`)
  // Stripping the sequences must return exactly the plain art.
  const sgr = new RegExp(`${ESC}\\[[0-9;]*m`, 'g')
  expect(out.replace(sgr, '')).toBe(art.plain.join('\n'))
})

// --------------------------------------------------------------- class styles

test('resolveClassStyle normalizes colors and merges classes in order', () => {
  const defs = {
    hot: { fill: '#f96', stroke: 'rgb(51, 51, 51)', 'font-weight': 'bold' },
    cold: { fill: 'lightblue', 'stroke-width': '4px', wobble: 'yes' },
  }
  expect(resolveClassStyle(['hot'], defs)).toEqual({
    fill: '#ff9966',
    stroke: '#333333',
    bold: true,
  })
  // Later classes win; unknown props and unknown classes are ignored.
  expect(resolveClassStyle(['hot', 'cold', 'ghost'], defs)).toEqual({
    fill: '#add8e6',
    stroke: '#333333',
    bold: true,
  })
  expect(resolveClassStyle(['ghost'], defs)).toBeNull()
  expect(resolveClassStyle(undefined, defs)).toBeNull()
  // A class whose only props are inexpressible resolves to null.
  expect(resolveClassStyle(['thin'], { thin: { 'stroke-width': '1px' } })).toBeNull()
})

test('contrastOn picks the readable foreground', () => {
  expect(contrastOn('#ffffe0')).toBe('#000000')
  expect(contrastOn('#4b0082')).toBe('#ffffff')
})

test('toAnsi applies class styles over the role theme', () => {
  const art = render('flowchart TD\n A[Hot]:::hot --> B\n classDef hot fill:#ff9966,color:#000000')
  if (art === null) throw new Error('render drew nothing')
  const out = toAnsi(art, { border: '2' }).join('\n')
  expect(out).toContain('48;2;255;153;102') // fill backs the node's cells
  expect(out).toContain(`${ESC}[2m`) // the unclassed node keeps the theme
  // Stripping the sequences must still return exactly the plain art.
  const sgr = new RegExp(`${ESC}\\[[0-9;]*m`, 'g')
  expect(out.replace(sgr, '')).toBe(art.plain.join('\n'))
})

test('a fill with no color gets a contrasting foreground', () => {
  const art = render('flowchart TD\n A[Pale]:::pale --> B\n classDef pale fill:#ffffe0')
  if (art === null) throw new Error('render drew nothing')
  const out = toAnsi(art).join('\n')
  expect(out).toContain('38;2;0;0;0') // black text on the pale fill
})

test('a bold-only class bolds the themed look instead of replacing it', () => {
  const art = render('flowchart TD\n A[Em]:::em --> B\n classDef em font-weight:bold')
  if (art === null) throw new Error('render drew nothing')
  const out = toAnsi(art, { border: '2;36' }).join('\n')
  expect(out).toContain(`${ESC}[1;2;36m`) // bold on top of the theme border
  expect(out).toContain(`${ESC}[2;36m`) // the unclassed node keeps the theme
})
