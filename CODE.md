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
  index.ts       public entry: render(), tries each grammar then falls back
  types.ts       Cls / Span / MermaidArt / RenderOptions
  ansi.ts        toAnsi() convenience over the span classes
  width.ts       display widths; width-data.ts is generated, do not edit
  canvas.ts      cell grid, direction-bit glyph resolution, flips, span runs
  labels.ts      entity decoding, tag/markdown stripping, wrapping, fitting
  graph.ts       shared model: Node/Edge/Group/Graph + caps
  parse.ts       all five grammars, source text -> model
  layout.ts      rank, order, place, route, draw (flowchart/state/class/ER)
  layout-seq.ts  sequence diagrams (own model, own geometry)
  fallback.ts    framed source box + too-wide hint
scripts/
  gen-width-data.ts   regenerates src/width-data.ts from the UCD
```

## Public API

`render(src, { maxWidth })` returns `{ plain, styled }`, or `null` only for
blank input. Everything else always produces art: unsupported grammars and
over-wide diagrams fall back to a framed copy of the source.

`plain[i]` and `styled[i]` are the same row, and `styled[i]` joined is exactly
`plain[i]` — enforced by `test/spans.test.ts` across a corpus of every diagram
type.

`Cls` is semantic (`border`/`text`/`edge`/`edgeLabel`/`title`/`hint`/`none`),
never a colour. This replaces the Rust `MermaidStyles` struct: layout no longer
depends on the theme, so a render survives a theme change and is plain JSON,
hence worker-transferable.

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
- **Blank canvas rows emit no spans.** Upstream trims trailing blanks from its
  plain lines but not its styled ones, so an empty row yielded a full-width run
  of spaces. Emitting `[]` is what makes the `styled == plain` invariant hold.
- **Semantic span classes** instead of ratatui `Line`/`Span` + `MermaidStyles`.

## Verification

`bun run differential` renders ~7180 cases through both the Rust original and
this port. It classifies each difference and **fails only on a regression** —
a case that diverges without involving grapheme clustering.

Current state: 5193 identical, 1987 expected (clustering), 0 regressions.

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

- **`maxWidth` below ~12 is not honoured by the fallback box.** The body chunks
  to `max(8, maxWidth - 4)` and the `mermaid: <kind>` title is never truncated,
  so a 20-column frame survives a `maxWidth: 8`. The art path always respects
  `maxWidth` — it reports oversize and defers to the fallback. Left as-is:
  nothing useful renders that narrow, and diverging here buys nothing.

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

162 tests. `test/render.test.ts`, `test/parse.test.ts`, `test/layout.test.ts`
and `test/labels.test.ts` are ports of the upstream `mod tests` (assertions and
intent preserved; names reworded). `test/width.test.ts` and
`test/spans.test.ts` are new — the latter covers the span contract, which
upstream has no equivalent of.

The unit suite alone is not sufficient: it passed while four width bugs were
live. `bun run differential` is what actually pins fidelity.

## Tooling

bun (runtime + test runner), tsgo (typecheck + emit), biome (lint + format).
No runtime dependencies.
