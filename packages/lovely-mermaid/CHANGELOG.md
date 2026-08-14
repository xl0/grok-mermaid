# Changelog

## [Unreleased]

### Breaking Changes

- Renamed the package to `lovely-mermaid` (formerly `grok-mermaid`); the repository moved to `xl0/lovely-mermaid` and the library now lives in `packages/lovely-mermaid` of a workspace.
- Renamed the span classification from `Cls`/`span.cls` to `Role`/`span.role`, freeing the word "class" for mermaid's author-assigned classes. `AnsiTheme` keys by `Role`.
- `MermaidArt` gained a required `classDefs` field.

### Added

- Author classes are surfaced: `A:::name` and `class A,B name` land on the spans of the cells that node paints (`span.classes`), and `classDef` declarations are parsed into `art.classDefs` (`{ name: { fill: '#f96', … } }`). The renderer never interprets either.
- `toAnsi` applies classDef styles best-effort on top of the role theme: `fill` backs the node's cells, `stroke` colors its border, `color` its text, `font-weight:bold` bolds (merging with the role theme rather than replacing it) — as truecolor SGR, with a black/white foreground picked by luminance when a fill declares no color. The interpreter is exported (`resolveClassStyle`, `classSgr`, `contrastOn`) for consumers with their own styling model; every other property is ignored.

### Fixed

- Flowchart inline edge labels containing `=`, `.` or `-` — quoted (`A --"a=b"--> B`) or not (`A -- a=b --> B`) — render their label instead of being dropped or mangled; the label now runs to the closing operator ([#2](https://github.com/xl0/lovely-mermaid/issues/2)).

### Changed

- Every grammar is now lenient. State, class, ER and sequence diagrams drop an unreadable statement with a warning and render the rest, instead of refusing the whole diagram; the one-final-line salvage retry is gone, subsumed by the general rule. A source in which nothing parses still returns `null`.
- Size caps truncate instead of refusing: a diagram over 128 nodes / 512 edges renders its prefix with a `diagram truncated: …` warning. A streamed diagram that outgrows a cap keeps its stable render instead of flipping to the source box forever.
- Diagram headers are matched exactly: `stateDiagramFoo` no longer parses as a state diagram, matching mermaid proper. `classDiagram-v2` is now recognised.
- CI now stages releases on npm instead of publishing directly. Builds keep OIDC provenance; the release script waits for the staged version, then asks for a 2FA code and approves it — publishing stays a manual act.

## [0.2.3] - 2026-08-11

### Fixed

- Parse and discard `:::class` for flowcharts, state and class diagrams.

## [0.2.2] - 2026-08-04

### Removed

- Removed the `NOTICE` file. Upstream ships none, so Apache-2.0 §4(d) never applied; keeping one only pushed a propagation obligation onto redistributors. Attribution now lives in `README.md` and `LICENSE`.

## [0.2.1] - 2026-08-01

### Added

- Added npm trusted publishing with build provenance. Releases are now built, signed and published by CI from a matching `v*` tag.

### Fixed

- Fixed leading and trailing empty rows around rendered diagrams.

## [0.2.0] - 2026-07-28

### Breaking Changes

- Changed `render()` to return natural-width art with a reported `width`; removed `maxWidth` and automatic source fallback. Callers can use `sourceBox()` when needed.

### Added

- Added `diagramKind()` and advisory parse warnings so callers can distinguish unsupported diagrams from malformed or partially rendered input.
- Added best-effort recovery for strict grammars by dropping and reporting one unreadable final line.

## [0.1.1] - 2026-07-28

## [0.1.0] - 2026-07-28

Initial public release.

### Added

- Added Unicode terminal rendering for flowchart, state, class, ER, and sequence diagrams with semantic styled spans and ANSI themes.
