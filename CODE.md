# Code

TypeScript port of the terminal Mermaid renderer from `xai-org/grok-build`
(`crates/codegen/xai-grok-markdown/src/mermaid.rs`, ~3.6k lines). Reference
checkout: `~/.cache/checkouts/github.com/xai-org/grok-build`.

## Layout

```
tools/
  width-oracle/  emits per-code-point widths from the unicode-width crate
  differential/  renders a corpus through Rust and TS, diffs the output
src/
  index.ts       public entry: render() + sourceBox(), tries each grammar
  types.ts       Cls / Span / MermaidArt
  ansi.ts        toAnsi() convenience over the span classes
  width.ts       display widths; width-data.ts is generated, do not edit
  canvas.ts      cell grid, direction-bit glyph resolution, flips, span runs
  labels.ts      entity decoding, tag/markdown stripping, wrapping, fitting
  graph.ts       shared model: Node/Edge/Group/Graph + caps
  parse.ts       all five grammars, source text -> model
  layout.ts      rank, order, place, route, draw (flowchart/state/class/ER)
  layout-seq.ts  sequence diagrams (own model, own geometry)
  source-box.ts  the source framed in a titled box
scripts/
  gen-width-data.ts   regenerates src/width-data.ts from the UCD
  gen-demo-svg.ts     regenerates docs/demo.svg, the README's colour example
```

`docs/demo.svg` paints real `render()` output through a theme, which a markdown
code fence cannot do — it is the only way to show what `Cls` buys. Its line
height is one em on purpose: box-drawing glyphs span at least that, so rows
overlap rather than gap in whatever font the viewer has.

`docs/streaming.gif` is a screen recording, GIF rather than MP4 because npm's
README renderer strips `<video>`. Both assets are referenced by absolute
`raw.githubusercontent.com` URL: npm rewrites *relative* paths inconsistently
for HTML `<img>`, and the README has to render on npm as well as GitHub.
Regenerate from a recording with:

```sh
ffmpeg -i in.mp4 -vf "fps=12,scale=900:-1:flags=lanczos,split[a][b];\
[a]palettegen=stats_mode=diff:max_colors=64[p];\
[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  -loop 0 docs/streaming.gif
```

Frame count dominates the size, not the palette — dropping to 32 colours saves
under 10%, so fps and width are the knobs worth turning.

## Public API

`render(src)` returns `{ plain, styled, width, warnings }`, or `null` when there
is no art to show: blank input, a syntax error, an unsupported grammar, or a
diagram over the cell cap. `sourceBox(src, maxWidth?)` frames the source in a
titled box. `diagramKind(src)` reads the header alone, so a caller can tell a
malformed diagram from one this renderer never draws.

**Width is reported, not enforced.** Layout takes no limit and never substitutes
the source box for art. Nothing in a diagram says whether an over-wide one
should be shrunk, scrolled, linked to an image or simply printed, so `width` is
the answer and the response is the caller's:

```ts
const art = render(src)
show(art && art.width <= cols ? art : sourceBox(src, cols))
```

`width` is the widest *painted* row, which is what a caller can act on — it
cannot be recovered from `plain`, whose rows are strings of code points rather
than columns.

Both entry points take untrusted source, so both apply `stripControls`.

`plain[i]` and `styled[i]` are the same row, and `styled[i]` joined is exactly
`plain[i]` — enforced by `test/spans.test.ts` across a corpus of every diagram
type plus a source box. Rendered diagrams omit empty rows before the first and
after the last painted row.

`Cls` is semantic (`border`/`text`/`edge`/`edgeLabel`/`title`/`none`), never a
colour. This replaces the Rust `MermaidStyles` struct: layout no longer depends
on the theme, so a render survives a theme change and is plain JSON, hence
worker-transferable.

## Syntax errors

Rendering is best-effort at two levels, because the grammars differ.

State, class, ER and sequence are **strict**: any statement they cannot read
fails the whole parse. `attempt` gives them one retry with the final line
removed — the only line a source can end mid-way through, whether it is being
streamed or was simply left unfinished. A source that then parses is drawn, with
`dropped, unreadable final line: "…"` recorded. Exactly one line, once: this
salvages a trailing fragment, it does not search for a parseable subset, so two
bad lines still yield `null`.

That retry is what makes streaming work without caller ceremony — sequence goes
7 display flips → 1 and class 3 → 1 (see below). It replaced an earlier
recommendation that the caller parse `src` up to its last newline itself; the
numbers are identical and one of the two had to go.

`attempt` dispatches through `diagramKind` rather than trying all five parsers
in turn. Equivalent, since every `parseX` gates on its own header keyword, but
it makes the salvage retry a single branch instead of five.

Flowchart is **lenient**, inherited from upstream (`parse_statement` returns
`()` there too) and from mermaid.js itself. `parseStatement` parses as far as it
can, keeps the prefix and drops the rest. Left alone that is the worst failure
mode in the library: `A[Start --> B` renders one box labelled `Start --> B` with
the author's edge silently gone, and junk text becomes a node. So every drop is
recorded in `graph.warnings` and surfaces as `art.warnings`:

- `readShape` running off the end still looking for its closer — the case the
  cursor cannot catch, since the statement *is* fully consumed, as a label.
- a statement not starting with a node, text where a link was expected, and a
  link with no target — the three `break`/`return` sites in `parseStatement`.

Warnings never fail a render. Zero warnings on all 134 hand-written corpus
diagrams; the fuzz corpus warns constantly, which is correct.

**They are advisory and must not gate rendering.** A source being streamed warns
at nearly every intermediate state — a label bracket is unterminated right up
until it is typed.

Streaming a five-line diagram in 4-character chunks, counting art↔source-box
transitions — one is ideal (box, then art for good):

| | flowchart | sequence | state | class |
| --- | --- | --- | --- | --- |
| `render` | 1 | 1 | 3 | 1 |
| without the salvage retry | 1 | 7 | 7 | 3 |
| gated on `warnings` | 11 | 7 | 7 | 3 |

State's extra pair is one early frame (`stateDiagram-v2` plus a partial `[*] -->`)
where dropping the last line leaves a header with no statements — nothing to
draw, so the box is right.

Making flowchart strict was rejected: it would reject diagrams that render fine
today and diverge from both upstream and mermaid proper.

`diagramKind` reads the header only, mirroring each `parseX`'s own header test,
which is what lets a caller separate "syntax error" from "type not drawn here" —
both of which are `null` from `render`.

## How the renderer works

Edges accumulate as **direction bits** per cell (`U`/`D`/`L`/`R`) rather than
glyphs, so crossings and junctions resolve correctly regardless of draw order;
`finalizeMask` turns bits into characters at the end, applying the per-cell
line style (dotted/thick). `occupied` marks box interiors that edge bits must
not overwrite.

Layout is Sugiyama-shaped: longest-path ranking over the DAG (back edges
dropped by DFS colouring), barycenter reordering within ranks to cut crossings,
then barycenter relaxation for cross-axis positions. Edges between adjacent
ranks share horizontal **bus** rows; skip and back edges route around the
diagram through vertical **lanes**. Track packing lets edges sharing an
endpoint reuse one row, which is why a merge draws a single arrowhead.

`BT`/`RL` reuse the `TD`/`LR` layout and flip the finished canvas, so text is
never mirrored — `flipHorizontal` reverses each text run back to reading order.

Subgraphs recurse: each is laid out into its own canvas, then blitted into a
framed box in its parent scope. An edge is drawn in the innermost scope holding
both endpoints; one crossing a boundary attaches to the frame.

## Deliberate deviations from upstream

- **`maxWidth` is gone; `width` is reported instead** (post-cutoff). Upstream
  folds the viewport decision into `render`, which forces the library to pick a
  response and to word it — its note tells the reader to "open the image", which
  only its own host has. See *Public API*. Upstream's gate is reproduced in
  `tools/differential/run.ts`, the only place that still needs it.
- **A strict grammar drops an unreadable final line instead of failing.**
  Upstream refuses the whole diagram; the port retries once without that line
  and draws the rest, warning about it. See *Syntax errors*. The differential
  reports these as `salvaged` — 58 cases.
- **Width is measured in painted cells, not allocated ones.** Upstream compares
  `max_width` against the canvas it allocated; some layouts leave the rightmost
  column blank, so a diagram that fits was declared too wide. The differential
  reports these as `slack` — 8 cases, all ones where the port draws a diagram
  where upstream printed the source.
- **Grapheme clusters measure and paint as one unit** (post-cutoff). Fixes
  emoji and combining sequences overflowing their boxes, and replaced ~60 lines
  of hand-written Unicode clustering plus a 156-range Extended_Pictographic
  table with `Intl.Segmenter`. Standalone zero-width characters are dropped
  rather than given a cell — they are invisible either way, and reserving one
  desynchronises width from what is drawn.
- **Box outlines are `border`, not `edge`.** Upstream classifies box corners as
  border and the sides as edge, which renders every box two-tone under any
  theme where the two differ. Characters are unaffected; only classification
  changed. All ported tests assert on `plain`, and they pass unchanged.
- **Empty outer canvas rows are omitted.** Upstream exposes padding rows from
  canvas allocation, most visibly a blank first row on `LR` flowcharts.
  Interior empty rows remain and emit no spans, preserving diagram spacing and
  the `styled == plain` invariant.
- **Literal control characters are stripped at both entry points.** They measure
  one column and paint none, so a box sized around one is drawn a column short
  of its own border; NUL additionally collides with the `CONT` sentinel and is
  dropped after layout has paid for its cell; ESC injects ANSI into scrollback.
  Upstream refuses to *decode* an entity into a control character but lets a
  literal one through; `render` and `sourceBox` close the same hole at both
  doors untrusted source comes in by.
- **Semantic span classes** instead of ratatui `Line`/`Span` + `MermaidStyles`.

## Verification

`bun run differential` renders ~7180 cases through both the Rust original and
this port. It classifies each difference and **fails only on a regression** —
a case that diverges for a reason not on the deviations list above.

`run.ts` holds a `renderBounded` that reapplies upstream's `max_width` gate,
since `render` no longer has one; that shim, and the note wrapping it needs,
live there rather than in `src` precisely because they are upstream's behaviour
and not the port's.

Current state: 4688 identical, 2016 expected (clustering), 58 salvaged (final
line dropped), 8 slack (painted vs allocated width), 410 trimmed (empty outer
rows), 0 regressions.

Commit `617cbf3` was the fidelity cutoff: up to there the port matched upstream
byte for byte on all 7180 cases. Divergence after it is deliberate and listed
below. See `tools/README.md` for how to run it.

## Width handling

**The grapheme cluster is the unit of both measuring and painting.** That one
decision is what keeps a box sized for exactly what gets drawn into it.

Clustering comes from `Intl.Segmenter` (UAX #29), built into Node and Bun, so
ZWJ sequences, skin-tone modifiers, variation selectors, keycaps, flags and
Hangul are handled without a table. Per-code-point widths come from the
`unicode-width` crate via `tools/width-oracle`, so they are exact by
construction rather than re-derived from the UCD.

`clusterWidth` takes the widest code point in the cluster, then forces 2 for an
emoji-presentation selector or a regional-indicator pair. Zero is a real
answer: a soft hyphen or zero-width space occupies nothing and is not painted.

The Rust original instead sizes with `UnicodeWidthStr` (which clusters) and
paints with `UnicodeWidthChar` (which does not), so `👨‍👩‍👧` is sized for 2
columns and painted into 8 — it overflows its own border. Splitting those two
notions is what the port dropped.

## Known limits (shared with upstream)

- **`sourceBox` can exceed its `maxWidth`.** The body chunks to
  `max(8, maxWidth - 4)`, so a 12-column frame survives a `maxWidth: 8`; and the
  ` mermaid: <kind> ` title is never truncated, so the frame is at least as wide
  as the source's first token — `stateDiagram-v2` needs 30 columns whatever
  `maxWidth` says. Every real diagram keyword fits inside ~30, so this only
  bites on a narrow viewport or a junk header. It reports its own `width`, so a
  caller that cares can check. Left as-is: nothing useful renders that narrow,
  and truncating the one line naming the diagram type is a poor trade.
- **An HTML entity in an unquoted label truncates the statement.**
  `splitStatements` treats `;` outside double quotes as a statement separator,
  so `A -->|go&#160;| B` splits mid-entity and the edge is dropped — only node
  `A` survives. Quoting the label (`A -->|"go&#160;"| B`) works. Mermaid proper
  wants special characters quoted anyway.
- **ER entity aliases are not parsed.** `p[Person] ||--o{ a["Bank Account"]`
  fails the grammar outright. Upstream's test for it asserts on the fallback
  box, which merely echoes the source, so it passes without rendering anything —
  `test/render.test.ts` records the real behaviour instead.

## Porting notes

- **`noUncheckedIndexedAccess` is off.** Rust distinguishes `chars[i]` (panics,
  so always guarded) from `chars.get(i)` (returns `Option`, branched on). TS's
  `arr[i] === undefined` reproduces the `.get()` case exactly, and the guarded
  cases are already guarded. Enabling it would mean ~500 `!` assertions for no
  safety gained.
- **Saturating arithmetic.** Rust `usize` never goes negative; `saturating_sub`
  is spelled `sat(a, b)` here. Unclamped, a negative index would silently read
  `undefined` instead of clamping.
- **Integer division.** Rust `/` on `usize` truncates; `half()` and
  `Math.ceil` stand in for `/ 2` and `div_ceil(2)`.
- **`asciiLower`/`asciiUpper`**, not `toLowerCase`. Rust's `to_ascii_lowercase`
  preserves length; `'İ'.toLowerCase()` does not, which would desync the
  offsets `parseNoteAnchor` slices with.
- **Char arrays.** Where Rust iterates `Vec<char>`, the port uses `[...s]` so
  indices are code points, not UTF-16 units.
- Control characters are written as `String.fromCharCode(n)`, never as literals
  in source — the `CONT` sentinel is NUL and would otherwise be invisible.

## Tests

185 tests. `test/render.test.ts`, `test/parse.test.ts`, `test/layout.test.ts`
and `test/labels.test.ts` are ports of the upstream `mod tests` (assertions and
intent preserved; names reworded). `test/width.test.ts` and
`test/spans.test.ts` are new — the latter covers the span contract, which
upstream has no equivalent of.

The unit suite alone is not sufficient: it passed while four width bugs were
live. `bun run differential` is what actually pins fidelity.

## Tooling

bun (runtime + test runner), tsgo (typecheck + emit), biome (lint + format).
No runtime dependencies.
