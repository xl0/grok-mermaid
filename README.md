# grok-mermaid

Render Mermaid diagrams as Unicode box-drawing art, for terminals.

A TypeScript port of the terminal Mermaid renderer in
[xai-org/grok-build](https://github.com/xai-org/grok-build)
(`crates/codegen/xai-grok-markdown/src/mermaid.rs`). No browser, no headless
Chrome, no SVG — a self-contained layout engine that emits text.

```
      ┌──────────────┐
      │ Parse source │
      └───────┬──────┘
              │
              ▼
       ╭────────────╮
       │ Supported? │
       ╰──────┬─────╯
      ┌───────┴────────┐
      ▼yes             ▼no
 ┌─────────┐   ┌───────────────┐
 │ Lay out │   │ Framed source │
 └────┬────┘   └───────┬───────┘
      └───────┬────────┘
              ▼
       ┌─────────────┐
       │ Unicode art │
       └─────────────┘
```

## Install

```sh
npm install grok-mermaid
```

## Usage

```ts
import { render } from 'grok-mermaid'

const art = render('flowchart LR\n  A[Start] --> B[Done]')
if (art) console.log(art.plain.join('\n'))
```

`render` draws the diagram at whatever size it needs and reports that as
`art.width`. It returns `null` when there is no art to show: blank input, a
syntax error, a diagram type it does not draw, or one large enough that laying
it out is refused.

### Syntax errors

Rendering is best-effort: a source that does not fully parse still draws
whatever it can, and says what it gave up on in `art.warnings`.

Flowcharts have always been lenient — mermaid.js is too — so a malformed
statement keeps whatever prefix parsed. That would quietly hand you a clean
diagram missing an edge you wrote, hence the warning:

```ts
const art = render('graph TD\n A[Start --> B')
// art.plain     one box labelled `Start --> B` — the edge is gone
// art.warnings  ['node "A": label is missing its closing `]`']
```

State, class, ER and sequence diagrams are stricter: one unreadable statement
fails the whole parse. They get a single retry without their last line, which is
the one a half-finished source ends on:

```ts
const art = render('stateDiagram-v2\n A --> B\n some garbage line')
// art.plain     the A --> B transition, drawn
// art.warnings  ['dropped, unreadable final line: "some garbage line"']
```

Two bad lines, or a bad line that is not the last, still gives `null` — this
salvages a trailing fragment, it does not hunt for a parseable subset.

An empty `warnings` means everything in the source made it into the art. Across
the 134 hand-written diagrams in the test corpus, none warn.

**Warnings are advisory — never use them to decide whether to show the art.**
The art is the best available drawing of the source either way, and a diagram
mid-edit is nearly always warning at some point. Surface them beside the
diagram, or once the source stops changing.

`diagramKind(src)` reads the header alone and returns `'flowchart' | 'state' |
'class' | 'er' | 'sequence'`, or `null` for a type this renderer does not draw.
It is what separates the two `null`s worth telling apart:

```ts
if (render(src) === null) {
  const kind = diagramKind(src)
  console.log(kind ? `${kind} diagram: syntax error` : 'diagram type not supported here')
}
```

### Streaming

Just call `render` on each prefix — no special handling needed. Best-effort
parsing is what makes that work: a partially arrived diagram keeps drawing
instead of alternating with the source box.

<img src="https://raw.githubusercontent.com/xl0/grok-mermaid/master/docs/streaming.gif" width="900" alt="A terminal replaying a stream of Mermaid diagrams — flowcharts and a state machine drawing themselves as box-drawing art, each one growing in place without ever reverting to a block of source text.">

Streaming a five-line diagram in 4-character chunks and counting how many times
the display would change between art and source box:

| | flowchart | sequence | state | class |
| --- | --- | --- | --- | --- |
| `render(src)` | 1 | 1 | 3 | 1 |
| before best-effort | 1 | 7 | 7 | 3 |
| gated on `warnings` | 11 | 7 | 7 | 3 |

One change is the ideal: source box until enough has arrived to draw, then art
for good. The state diagram's extra pair is a single early frame where only the
header has arrived intact and there is genuinely nothing to draw.

The last row is why warnings must not gate rendering — during streaming they
fire almost continuously, since a label bracket is unterminated right up until
the moment it is typed.

### Fitting a viewport

The renderer takes no width limit. Nothing about a terminal tells it whether a
wide diagram should be shrunk, scrolled, linked to an image or just printed, so
the decision stays with you — compare `art.width` against the space you have:

```ts
import { render, sourceBox } from 'grok-mermaid'

const cols = process.stdout.columns
const art = render(src)
if (art && art.width <= cols) console.log(art.plain.join('\n'))
else {
  console.log(sourceBox(src, cols).plain.join('\n'))
  console.log(`(diagram needs ${art?.width ?? '?'} columns)`)
}
```

`sourceBox(src, maxWidth?)` frames the source in a titled box, hard-wrapping to
`maxWidth`. It is the usual thing to show when the art does not fit or does not
exist, but it is yours to choose, and yours to caption. Its result can still
exceed `maxWidth`: the body wraps to `max(8, maxWidth - 4)` and the
` mermaid: <kind> ` title is never truncated, so a long first token sets a
floor — check its `width` if that matters.

### Colour

The core is colour-blind. `styled` carries the same rows as `plain`, split into
runs tagged with a semantic class, so you map classes to your own theme:

<img src="https://raw.githubusercontent.com/xl0/grok-mermaid/master/docs/demo.svg" width="330" alt="A flowchart rendered as Unicode box-drawing art on a dark panel: grey box outlines, white node labels, cyan connectors and arrowheads, grey edge labels.">

That image is real `render()` output painted through one such theme — it is
generated by `bun run gen:demo`, not drawn by hand.

```ts
import { type Cls, render } from 'grok-mermaid'

const art = render(src)!

const theme: Partial<Record<Cls, (s: string) => string>> = {
  border: dim, text: white, edge: cyan, edgeLabel: gray,
}
const out = art.styled.map((row) =>
  row.map((span) => (theme[span.cls] ?? identity)(span.text)).join(''),
)
```

| Class | What it covers |
| --- | --- |
| `border` | box outlines, subgraph frames, compartment rules |
| `text` | node, participant and compartment labels |
| `edge` | connector lines and arrowheads |
| `edgeLabel` | text sitting on an edge |
| `title` | the `mermaid: <kind>` header of a source box |
| `none` | blank filler |

`styled[i]` joined is always exactly `plain[i]`, so you can swap between them
freely.

Because layout carries no colour, a render can be cached across theme changes
and passed across a worker boundary — the output is plain JSON.

For the common case there is a helper:

```ts
import { render, toAnsi } from 'grok-mermaid'

console.log(toAnsi(render(src)!).join('\n'))
```

`toAnsi(art, theme)` takes `Partial<Record<Cls, string>>` of SGR parameters
(`'2'` dim, `'36'` cyan, `'38;5;244'` for 256-colour), defaulting to a dim
frame with cyan connectors.

## Supported diagrams

| Type | Notes |
| --- | --- |
| `graph` / `flowchart` | `TD`/`TB`, `BT`, `LR`, `RL`; `subgraph` nesting; node shapes; solid/dotted/thick links; arrow, circle, cross heads; edge labels |
| `stateDiagram` / `stateDiagram-v2` | states, transitions, `[*]` start/end, `<<choice>>`, descriptions, composite states flattened |
| `classDiagram` | compartments, annotations, generics, cardinalities, inheritance/realization/composition/aggregation/dependency |
| `erDiagram` | entities, attributes, crow's-foot cardinalities |
| `sequenceDiagram` | participants, messages, self-messages, notes, `loop`/`alt`/`opt` dividers, `autonumber` |

## Credits

Inspired by Simon Willison's
[grok-mermaid.html](https://tools.simonwillison.net/grok-mermaid)
([source](https://github.com/simonw/tools/blob/main/grok-mermaid.html)), which
compiles the original Rust renderer to WebAssembly so it runs in a browser.
That demo is what made the renderer worth having outside the Grok CLI; this
port takes the other route and reimplements it in TypeScript, so it needs no
WASM and runs anywhere JS does.

100% of the code written by Opus 5, with a healthy dose of feedback and direction from my side.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
