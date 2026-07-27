# Plan

Port the terminal Mermaid renderer from `xai-org/grok-build`
(`crates/codegen/xai-grok-markdown/src/mermaid.rs`, ~3.6k lines) to a modern
TypeScript library.

Reference checkout: `~/.cache/checkouts/github.com/xai-org/grok-build`.

**Intent:** output-compatible with the Rust original. Same layout decisions,
same glyphs, same fallbacks. Where the port deviates it must be deliberate and
recorded in `CODE.md`. The public API is idiomatic TS (semantic spans, no
ratatui types); everything under it mirrors the Rust structure closely enough
that upstream changes can be diffed across.

Cargo has no usable toolchain here, so golden files cannot be generated from
the Rust build. Tests are ported from the upstream `mod tests` instead — that
suite is thorough (~90 cases) and mostly asserts on rendered text.

## [x] Skeleton

package.json, tsconfig (tsgo), biome, license + attribution, public types,
stub `render`, smoke test.

## [ ] Unicode width

`charWidth` / `stringWidth` matching the `unicode-width` crate: control and
combining marks 0, East Asian Wide/Fullwidth 2, else 1. Range tables generated
into `src/width-data.ts` by `scripts/gen-width-data.ts`; zero runtime deps.

## [ ] Canvas

Cell grid (char, class, mask, style, occupied), bit-mask junction glyphs,
dotted/thick variants, vertical/horizontal flips, run-grouping into spans.

## [ ] Parsers

Statement splitting, label cleaning (HTML tags, entities, markdown), then
`parseGraph`, `parseState`, `parseClass`, `parseEr`, `parseSequence`.

## [ ] Layout

Ranking (DFS DAG, back edges ignored), crossing minimisation, barycenter
position assignment, track assignment for buses and lanes, TD and LR placement,
edge routing, subgraph frames, class/ER compartment boxes.

## [ ] Sequence layout

Separate pass: participant columns, gap solving, messages, notes, dividers.

## [ ] Fallback

Framed source box, width-driven chunking, too-wide hint.

## [ ] Tests

Port the upstream suite. Internals it pokes (`parseGraph`, `wrapLabel`,
`decodeHtmlEntities`, `computeRanks`, …) are exported from module files and
imported directly by tests, not re-exported from the public entry point.

## [ ] Ship

`toAnsi` helper, build via tsgo, README examples verified against real output.
