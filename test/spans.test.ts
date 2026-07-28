import { expect, test } from 'bun:test'
import { Canvas, drawText } from '../src/canvas.ts'
import { render, toAnsi } from '../src/index.ts'

const CORPUS: [string, string][] = [
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
  ['fallback', 'gantt\n title Plan\n section A\n task :a1, 2024-01-01, 30d'],
  ['too wide', 'flowchart LR\n A[aaaaaaaaaaaaaaaaaaaa] --> B[bbbbbbbbbbbbbbbbbbbb]'],
]

const ESC = String.fromCharCode(27)

test('every styled row reconstructs its plain row exactly', () => {
  for (const [name, src] of CORPUS) {
    const art = render(src, { maxWidth: 40 })
    if (art === null) throw new Error(`${name}: render returned null`)
    expect(art.styled.length).toBe(art.plain.length)
    art.plain.forEach((row, i) => {
      const joined = art.styled[i].map((s) => s.text).join('')
      expect(`${name}: ${joined}`).toBe(`${name}: ${row}`)
    })
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
  for (const [name, src] of CORPUS) {
    const art = render(src, { maxWidth: 40 })
    if (art === null) throw new Error(`${name}: render returned null`)
    for (const row of art.styled) {
      for (let i = 1; i < row.length; i++) {
        expect(`${name}: ${row[i].cls}`).not.toBe(`${name}: ${row[i - 1].cls}`)
      }
    }
  }
})

test('a box outline is a single border span', () => {
  const art = render('graph TD\n A[Start] --> B[End]', { maxWidth: 80 })
  if (art === null) throw new Error('render returned null')
  const top = art.styled[art.plain.findIndex((l) => l.includes('┌'))]
  expect(top.filter((s) => s.cls !== 'none')).toEqual([{ text: '┌───────┐', cls: 'border' }])
})

test('toAnsi leaves text intact when the theme is empty', () => {
  const art = render('graph TD\n A --> B', { maxWidth: 80 })
  if (art === null) throw new Error('render returned null')
  expect(toAnsi(art, {})).toEqual(art.plain)
})

test('toAnsi wraps styled runs in SGR sequences', () => {
  const art = render('graph TD\n A --> B', { maxWidth: 80 })
  if (art === null) throw new Error('render returned null')
  const out = toAnsi(art, { border: '2' }).join('\n')
  expect(out).toContain(`${ESC}[2m`)
  expect(out).toContain(`${ESC}[0m`)
  // Stripping the sequences must return exactly the plain art.
  const sgr = new RegExp(`${ESC}\\[[0-9;]*m`, 'g')
  expect(out.replace(sgr, '')).toBe(art.plain.join('\n'))
})
