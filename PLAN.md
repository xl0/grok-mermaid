# Plan

`lovely-mermaid`: render Mermaid as Unicode box-drawing art for terminals.
Born as a byte-faithful port of the Rust renderer in `xai-org/grok-build`;
that bar has been met and retired. The bar now is good terminal output —
every deliberate divergence is listed in `CODE.md`, and the old differential
harness is gone with it (its fuzz corpus lives on in the test suite).
Review docs are episodic: `REDESIGN.md` and `REWORK.md` were executed and
deleted; `REVIEW.md` (2026-08-15) is the current one, holding open findings.

**Intent:** best-effort rendering everywhere (draw as much as possible, warn
about the rest — it is what makes streaming work), a small semantic API
(`role` for what the renderer decided, `classes` for what the author wrote),
and one module per diagram type so new types are cheap to add.

## [x] The port (2026-07)

Skeleton, renderer, all five grammars, `toAnsi`, fallback box; upstream test
suite ported; differential harness over ~7180 cases —
byte-identical at the fidelity cutoff (`617cbf3`). Post-cutoff wins: grapheme
clustering via `Intl.Segmenter`, `width` reported instead of `maxWidth`
enforced, parse warnings, control characters stripped, staged npm releases.

## [x] Redesign (2026-08-12)

- Workspace: library moved to `packages/lovely-mermaid`; `demo/` to come as a
  sibling. Tools stay at the repo root. Repo renamed to `xl0/lovely-mermaid`.
- `parse.ts` split into `statements.ts` + `diagrams/{flowchart,state,class,er,
  sequence}.ts` + `registry.ts`; `diagramKind` and dispatch derive from one
  table. `ClassInfo` parallel arrays replaced by `Node.sections`.
- Lenient everywhere: strict grammars drop unreadable statements with
  warnings (block bodies swallowed structurally); the salvage retry died.
  Caps truncate with a warning instead of refusing (`MAX_CANVAS_CELLS` stays
  fatal). Headers match exactly.
- API: `Cls`/`span.cls` → `Role`/`span.role`; author classes surfaced on
  `span.classes` (flowchart `:::` + `class`, state `class`); `classDef`s
  parsed into `art.classDefs`. `toAnsi` stays role-only.
- Package renamed `lovely-mermaid`; next release 0.3.0.
- Tests reworked into markdown golden files (`test/cases/`, one runner,
  `bun run test:update` to regenerate); programmatic tests keep only what
  the art can't show.

## [ ] Release 0.3.0

- [ ] Re-create the npm trusted publisher for `lovely-mermaid` (stage-only,
      `publish.yml`), then `bun run release minor` from the package dir.
- [ ] Deprecate `grok-mermaid` on npm with a pointer.

## [ ] Features (order from REDESIGN.md)

- [x] Composite states as frames, `--` regions, `[*]` scoped per group.
- [x] Flowchart v2 `A@{shape: cyl, label: "..."}` node syntax.
- [x] Sequence activations thicken the lifeline over the active range.
- [x] Cardinalities at their own edge ends (`Edge.cardFrom`/`cardTo`), verb
      mid-edge; `0..*` → `*`.
- [x] ER aliases with spaces (`a["Bank Account"]`).
- [x] `:::` capture in state/class diagrams — classes work in every grammar
      that has them.
- [x] classDef styles applied best-effort: `resolveClassStyle` (fill/stroke/
      color/bold, normalized colors) + contrast guard; `toAnsi` layers it
      over the role theme (bold-only merges rather than replaces), demo
      calls `toAnsi` (`/styles` preset).
- [x] Whole-codebase review rework (2026-08-14, see `REWORK.md`): shared scan
      helpers (quote rules live in `statements.ts` only), `:::` parsed inline
      (captureStyleTags gone), `class A,B` unified, ten bug fixes (frontmatter
      skipped + its title drawn, quoted cardinality, region subtree loss,
      seq-cap throw, lane edges cutting through boxes, …), diamonds drawn as
      double-bordered boxes, css-colors.ts generated from spec.
- [x] New diagram types (2026-08-15): pie (bar list), mindmap (tree),
      timeline, gitGraph (commit lanes, newest-first). One file each in
      `diagrams/`, drawing rows straight onto a Canvas.
- [x] Demo app in `demo/` (SvelteKit): light/dark page theme, class-styled
      `/styles` preset. lovely-mermaid by source alias; svelte-asciiart@0.1.0
      and lovely-ansi-svg@0.1.0 from npm (dev symlinks retired) — Pages
      deploy is unblocked. AsciiArt colors resolve at parse time through its
      `theme` prop (palette + panel fg/bg, keep in sync with
      `--term-bg`/`--term-fg`).
- [ ] Maybe a `bin` CLI in the main package (mermaid/markdown → art).

## [x] Review findings (2026-08-15)

All actionable `REVIEW.md` items landed, one commit each: the five
silent-corruption bugs (kebab ids, `class A["Label"]`, BT multi-row content,
state `-->` labels, back-edge lane cut-through — solved by local
adjacent-back routing rather than a left lane strip), the medium tier
(sequence `-x` boundary, ER quotes, tab painting, parallel-label join), the
low tier, plus the streaming-prefix sweep and the ANSI snapshot. Parked for
the next major: typed warnings, `Span.node`. Changelog updated under
`[Unreleased]`.

## Open questions

- Parked ideas with data: truncating sequence message text at `MAX_LABEL`,
  word-wrapping the source-box body.
- Decided: parsers stay internal (tests import module paths); no auto-flip /
  direction override to fit — width policy stays entirely with the caller.
