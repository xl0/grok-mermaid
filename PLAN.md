# Plan

Port the terminal Mermaid renderer from `xai-org/grok-build`
(`crates/codegen/xai-grok-markdown/src/mermaid.rs`) to a modern TypeScript
library.

**Intent:** output-compatible with the Rust original — same layout decisions,
same glyphs, same fallbacks. Deviations must be deliberate and recorded in
`CODE.md`. The public API is idiomatic TS (semantic spans, no ratatui types);
everything under it mirrors the Rust structure closely enough to diff against
upstream when it changes.

Cargo has no usable toolchain here, so golden files cannot be generated from
the Rust build. The upstream `mod tests` suite was ported instead.

## [x] Skeleton

Package, tsgo, biome, Apache-2.0 + NOTICE attribution, public types.

## [x] Renderer

Width tables generated from Unicode 17; canvas with direction-bit glyph
resolution; label cleaning; all five parsers; graph and sequence layout;
fallback box; `toAnsi` helper.

## [x] Tests

162 passing. Upstream suite ported, plus new width and span-contract tests.
Fuzzed 20k generated sources: no throws, span invariant holds throughout.

## [x] Differential verification

`bun run differential` diffs ~7180 rendered cases against the Rust original.
7180/7180 identical. Found four width/line bugs the unit suite missed.
Per-code-point widths are now generated from the `unicode-width` crate itself
rather than re-derived from the UCD.

**This is the fidelity cutoff.** Up to this commit the port matches upstream
byte for byte. Deviations after it are deliberate and listed below.

## [x] Grapheme clustering (post-cutoff)

Measure and paint in grapheme clusters, via `Intl.Segmenter`. Fixes emoji and
combining sequences overflowing their boxes — an upstream bug the port had
faithfully reproduced — and deletes the hand-written Unicode clustering and its
Extended_Pictographic table. `width.ts` 147 → 73 lines, `width-data.ts` one
column instead of two, `drawWidth`/`codePointWidth` gone from the public
surface. Differential: 0 regressions, 1987 expected divergences.

## [ ] Possible further divergence

Byte-compatibility is no longer the bar; good-looking output is. The
differential harness now gates on regressions only, so each change can be
reviewed against upstream rather than blocked by it.

Candidates, none obviously worth it yet:
- Honour `maxWidth` in the fallback box below ~12 columns (truncate the title).
- Wrap fallback body lines on word boundaries rather than hard-chunking.
- Revisit the `assignTracks` O(n²) compatibility scan if large diagrams show up.

## [ ] Ship

Publish to npm once the name is confirmed free. README examples are generated
from real output; `bun run prepublishOnly` gates on check + typecheck + tests +
build.

## Open questions

- Upstream `render` is called per repaint by the pager, re-parsing each time.
  If a consumer wants cheap relayout on resize, parse could be cached
  separately from layout. Not needed until someone asks.
- Whether to expose the parsers publicly. Tests import them from module paths;
  keeping them off the entry point leaves the API surface small.
- Known limits inherited from upstream are listed in `CODE.md`.
