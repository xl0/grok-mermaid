# Plan

`lovely-mermaid`: render Mermaid as Unicode box-drawing art for terminals.
Born as a byte-faithful port of the Rust renderer in `xai-org/grok-build`;
that bar has been met and retired. The bar now is good terminal output — the
differential harness gates on regressions only, and every deliberate
divergence is listed in `CODE.md`. `REDESIGN.md` holds the design review that
set the current direction.

**Intent:** best-effort rendering everywhere (draw as much as possible, warn
about the rest — it is what makes streaming work), a small semantic API
(`role` for what the renderer decided, `classes` for what the author wrote),
and one module per diagram type so new types are cheap to add.

## [x] The port (2026-07)

Skeleton, renderer, all five grammars, `toAnsi`, fallback box; upstream test
suite ported (now 191 tests); differential harness over ~7180 cases —
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
- [ ] New diagram types, by TUI fit: pie (bar list), mindmap (tree), timeline,
      gitGraph (commit lanes). Registry makes each a one-file addition.
- [x] Demo app in `demo/` (SvelteKit, pulled from the old `classnames` branch,
      classes stripped for now). lovely-mermaid by source alias;
      svelte-asciiart via `bun link` until its 0.0.6 (with `cellSize`) is
      published — Pages deploy waits on that.
- [ ] Maybe a `bin` CLI in the main package (mermaid/markdown → art).

## Open questions

- Parked ideas with data: truncating sequence message text at `MAX_LABEL`,
  word-wrapping the source-box body.
- Decided: parsers stay internal (tests import module paths); no auto-flip /
  direction override to fit — width policy stays entirely with the caller.
