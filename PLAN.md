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

160 passing. Upstream suite ported, plus new width and span-contract tests.
Fuzzed 20k generated sources: no throws, span invariant holds throughout.

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
