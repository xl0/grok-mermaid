# grok-mermaid

Render Mermaid diagrams as Unicode box-drawing art, for terminals.

A TypeScript port of the terminal Mermaid renderer in
[xai-org/grok-build](https://github.com/xai-org/grok-build)
(`crates/codegen/xai-grok-markdown/src/mermaid.rs`). No browser, no headless
Chrome, no SVG — a self-contained layout engine that emits text.

```
╭─────────╮
│  Start  │
╰────┬────╯
     │
     ▼
╭─────────╮
│  Done   │
╰─────────╯
```

## Install

```sh
npm install grok-mermaid
```

## Usage

```ts
import { render } from 'grok-mermaid'

const art = render('flowchart LR\n  A[Start] --> B[Done]', { maxWidth: 80 })
if (art) console.log(art.plain.join('\n'))
```

`render` returns `null` only for blank input. Everything else always produces
art: unsupported diagram types, and diagrams too wide for `maxWidth`, fall back
to the source in a framed box.

### Colour

The core is colour-blind. `styled` carries the same rows as `plain`, split into
runs tagged with a semantic class, so you map classes to your own theme:

```ts
const art = render(src, { maxWidth: process.stdout.columns })!

const theme = { border: dim, text: white, edge: cyan, edgeLabel: gray }
const out = art.styled.map((row) =>
  row.map((span) => (theme[span.cls] ?? identity)(span.text)).join(''),
)
```

Classes are `border`, `text`, `edge`, `edgeLabel`, `title`, `hint`, `none`.

Because layout carries no colour, a render can be cached across theme changes
and passed across a worker boundary — the output is plain JSON.

## Supported diagrams

| Type | Notes |
| --- | --- |
| `graph` / `flowchart` | `TD`/`TB`, `BT`, `LR`, `RL`; `subgraph` nesting; node shapes; solid/dotted/thick links; arrow, circle, cross heads; edge labels |
| `stateDiagram` / `stateDiagram-v2` | states, transitions, `[*]` start/end, `<<choice>>`, descriptions, composite states flattened |
| `classDiagram` | compartments, annotations, generics, cardinalities, inheritance/realization/composition/aggregation/dependency |
| `erDiagram` | entities, attributes, crow's-foot cardinalities |
| `sequenceDiagram` | participants, messages, self-messages, notes, `loop`/`alt`/`opt` dividers, `autonumber` |

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
