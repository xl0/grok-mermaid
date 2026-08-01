# Changelog

## [Unreleased]

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
