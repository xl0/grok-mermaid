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

161 passing. Upstream suite ported, plus new width and span-contract tests.

## [ ] Ship

- README examples regenerated from real output rather than hand-written.
- Decide whether `render` should accept a `Cls` remap or stay minimal.
- Publish: `npm publish` once the name is confirmed free.

## Open questions

- **`stringWidth` is a plain sum of code point widths.** `unicode-width` 0.2
  additionally handles emoji ZWJ sequences and prepended concatenation marks at
  the *string* level, so `👨‍👩‍👧` measures 2 there and 6 here. Only affects labels
  containing emoji sequences. Fix if it ever matters; not worth the table now.
- Upstream `render` takes `max_width: Option<usize>` and is called per-repaint
  by the pager. If a consumer wants incremental relayout on resize, the parse
  step could be cached separately from layout — not needed until asked for.
