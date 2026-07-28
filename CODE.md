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
this port and fails on any difference. **Currently 7180/7180 identical.** See
`tools/README.md`; it needs a Rust toolchain and a grok-build checkout, and it
copies upstream's `mermaid.rs` in at run time rather than vendoring it.

It found four bugs the ported unit tests missed, all in width and line
handling — see `tools/README.md` for the list. Extend `corpus.ts` when
touching layout or width.

## Width handling

Two width functions, deliberately inconsistent, because `unicode-width` is:

- `codePointWidth(cp)` — `UnicodeWidthChar::width(c).unwrap_or(0)`. Used when
  painting a character into a cell. A control character is 0.
- `stringWidth(s)` — `UnicodeWidthStr::width`. Used for sizing. A control
  character is 1, and emoji presentation sequences fuse into one 2-column
  cluster.

Collapsing the two mismeasures anything containing a tab. `drawWidth` is
`codePointWidth` floored at 1, matching `char_width(c).max(1)` at the Rust
call sites that paint glyphs.

`src/width-data.ts` is generated from the `unicode-width` crate itself via
`tools/width-oracle`, not re-derived from the UCD, so per-code-point widths are
exact by construction. The string-level clustering rules are hand-written and
cover emoji only; the crate's script ligatures (Arabic Lam-Alef, Hebrew
Alef-Lamed, Khmer Coeng, Buginese, Lisu, Old Turkic, Tifinagh, Kirat Rai),
emoji tag sequences, and the quote + `FE00`/`FE01`/`FE02` cases are not
implemented — they need several more property tables and do not arise in
diagram labels.

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
