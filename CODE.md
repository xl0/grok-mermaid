# Code

`lovely-mermaid` (formerly `grok-mermaid`): a terminal Mermaid renderer in
TypeScript. Started as a 1:1 port of `xai-org/grok-build`
(`crates/codegen/xai-grok-markdown/src/mermaid.rs`, ~3.6k lines; reference
checkout: `~/.cache/checkouts/github.com/xai-org/grok-build`), now deliberately
diverging where terminal output can be better. `REDESIGN.md` records the
redesign rationale and the feature roadmap.

## Layout

```
CHANGELOG.md              (in the package) release notes; current changes under Unreleased
.pi/prompts/cl.md         audits Unreleased changelog entries against the commits
.github/workflows/
  publish.yml             tag-triggered npm staging via trusted publishing
tools/                    repo-level dev tooling, not shipped
  width-oracle/           emits per-code-point widths from the unicode-width crate
  differential/           renders a corpus through Rust and TS, diffs the output
packages/lovely-mermaid/  the npm package (workspace member; demo/ will be a sibling)
  scripts/
    gen-width-data.ts     regenerates src/width-data.ts from the oracle
    gen-demo-svg.ts       regenerates docs/demo.svg, the README's colour example
    release.ts            rolls the changelog, bumps, verifies, commits, tags, pushes
  src/
    index.ts              public entry: render() + re-exports
    types.ts              Role / Span / MermaidArt
    ansi.ts               toAnsi() convenience over the span roles
    width.ts              display widths; width-data.ts is generated, do not edit
    canvas.ts             cell grid, direction-bit glyphs, flips, span runs, class tags
    labels.ts             entity decoding, tag/markdown stripping, wrapping, fitting
    statements.ts         source -> statements, shared string helpers, classDef parsing
    graph.ts              shared model: Node/Edge/Group/Graph + caps + truncation
    registry.ts           the diagram table; diagramKind and render dispatch through it
    diagrams/             one module per diagram type: parse + layout glue
      flowchart.ts  state.ts  class.ts  er.ts  sequence.ts
    layout.ts             rank, order, place, route, draw (flowchart/state/class/ER)
    layout-seq.ts         sequence diagrams (own model in diagrams/sequence.ts, own geometry)
    source-box.ts         the source framed in a titled box
```

Adding a diagram type is one module in `diagrams/` plus one `DIAGRAMS` entry:
the module owns its header keywords (`headers`), parser and layout glue, and
the registry derives both `diagramKind` and `render` dispatch from the same
table, so the header test a parser gates on and the one `diagramKind` reports
cannot drift apart.

`docs/demo.svg` paints real `render()` output through a theme, which a markdown
code fence cannot do — it is the only way to show what `Role` buys. Its line
height is one em on purpose: box-drawing glyphs span at least that, so rows
overlap rather than gap in whatever font the viewer has.

`docs/streaming.gif` is a screen recording, GIF rather than MP4 because npm's
README renderer strips `<video>`. Both assets are referenced by absolute
`raw.githubusercontent.com` URL (under `packages/lovely-mermaid/docs/`): npm
rewrites *relative* paths inconsistently for HTML `<img>`, and the README has
to render on npm as well as GitHub. Regenerate from a recording with:

```sh
ffmpeg -i in.mp4 -vf "fps=12,scale=900:-1:flags=lanczos,split[a][b];\
[a]palettegen=stats_mode=diff:max_colors=64[p];\
[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  -loop 0 docs/streaming.gif
```

Frame count dominates the size, not the palette — dropping to 32 colours saves
under 10%, so fps and width are the knobs worth turning.

## Public API

`render(src)` returns `{ plain, styled, width, classDefs, warnings }`, or
`null` when there is no art to show: blank input, an unsupported grammar, a
source in which not one statement parsed, or a diagram whose layout exceeds
the canvas cell cap. `sourceBox(src, maxWidth?)` frames the source in a titled
box. `diagramKind(src)` reads the header alone, so a caller can tell a
malformed diagram from one this renderer never draws.

**Width is reported, not enforced.** Layout takes no limit and never substitutes
the source box for art. Nothing in a diagram says whether an over-wide one
should be shrunk, scrolled, linked to an image or simply printed, so `width` is
the answer and the response is the caller's:

```ts
const art = render(src)
show(art && art.width <= cols ? art : sourceBox(src, cols))
```

`width` is the widest *painted* row, which is what a caller can act on — it
cannot be recovered from `plain`, whose rows are strings of code points rather
than columns.

Both entry points take untrusted source, so both apply `stripControls`.

`plain[i]` and `styled[i]` are the same row, and `styled[i]` joined is exactly
`plain[i]` — enforced by `test/spans.test.ts` across a corpus of every diagram
type plus a source box. Rendered diagrams omit empty rows before the first and
after the last painted row.

**Roles vs classes.** `Span.role` is semantic and renderer-decided
(`border`/`text`/`edge`/`edgeLabel`/`title`/`none`), never a colour: layout
does not depend on the theme, so a render survives a theme change and is plain
JSON, hence worker-transferable. `Span.classes` is author-assigned — `:::name`
or `class A,B name` — carried by every cell the classed node paints, including
blank box interior (so a consumer can fill the box). `art.classDefs` holds the
parsed `classDef` declarations (`name -> {prop: value}`), uninterpreted.
`toAnsi` maps roles only; class-aware styling is the consumer's, via `styled`
+ `classDefs`. Class assignment is parsed for flowcharts (`:::` and `class`)
and state diagrams (`class`); classDefs for flowchart/state/class diagrams. A
`:::` in state/class diagrams is still only swallowed by `dropStyleTags` —
statement-level, so it cannot know its node.

## Syntax errors

**Every grammar is lenient; caps truncate.** The library rule: render as much
as possible, report what was lost in `warnings`.

- Flowchart keeps the parseable *prefix of a statement* (inherited from
  upstream and mermaid.js): `A[Start --> B` renders one box labelled
  `Start --> B` with a warning naming the unterminated bracket. The three
  `break`/`return` sites in `parseStatement` and `readShape`'s
  running-off-the-end each warn.
- State, class, ER and sequence drop an unreadable *statement* whole
  (`dropped, unreadable statement: "…"`) and keep going. Statements in these
  grammars are independent, so a drop cannot corrupt its neighbours. Block
  delimiters are handled structurally first: a bad `class X {` / entity `{`
  declaration swallows its whole body (`'skip'` sentinel), since reading the
  members as top-level statements would misparse everything inside.
- Size caps truncate: `MAX_NODES`/`MAX_EDGES` (and the flowchart subgraph
  caps) stop the parse, render the prefix, and warn
  `diagram truncated: <cap> reached`. Rationale: streaming — a growing diagram
  can never un-cap, so the old refusal flipped it to the source box forever;
  the truncated prefix is stable because appending never changes it. Cost is
  bounded by construction: the capped prefix is exactly the largest legal
  diagram. `MAX_CANVAS_CELLS` stays fatal (`null`) — it is discovered after
  layout ran and there is no partial canvas to show.
- `null` still means "nothing there": no recognised header, zero nodes /
  participants after parsing, or the cell cap. Prose that happens to start
  with `sequenceDiagram` refuses; warnings never substitute for having parsed
  something.

This replaced the earlier salvage retry (one attempt without the final line):
per-statement dropping subsumes it, and `attempt` in `index.ts` is gone.
Streaming needs no caller ceremony either way.

**Warnings are advisory and must not gate rendering.** A source being streamed
warns at nearly every intermediate state — a label bracket is unterminated
right up until it is typed.

Headers are matched exactly (`headers` lists in each diagram module):
upstream's `starts_with` accepts `stateDiagramFoo`, which mermaid proper
rejects. `classdiagram-v2` is recognised.

## How the renderer works

Edges accumulate as **direction bits** per cell (`U`/`D`/`L`/`R`) rather than
glyphs, so crossings and junctions resolve correctly regardless of draw order;
`finalizeMask` turns bits into characters at the end, applying the per-cell
line style (dotted/thick). `occupied` marks box interiors that edge bits must
not overwrite. Cells also carry a `tag` — the space-joined author classes of
the node that painted them, stamped via `curTag` the way `curStyle` stamps
line style — which `toLines` splits runs on and emits as `Span.classes`.

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

Class and ER compartments live on `Node.sections` (title / attrs / methods
rows, pre-formatted by the parser); `layoutClass` draws them verbatim. The
title row centres, the rest left-align.

## Deliberate deviations from upstream

- **`maxWidth` is gone; `width` is reported instead** (post-cutoff). Upstream
  folds the viewport decision into `render`; see *Public API*. Upstream's gate
  is reproduced in `tools/differential/run.ts`, the only place that needs it.
- **Every grammar is lenient and caps truncate** (post-cutoff, supersedes the
  salvage retry). Upstream refuses a strict-grammar diagram on one unreadable
  statement and any diagram over a cap. See *Syntax errors*. The differential
  reports these as `lenient` — 135 cases.
- **Headers match exactly.** Upstream's prefix test accepts junk like
  `stateDiagramFoo`; mermaid proper does not. Differential class `header`
  (0 cases in the corpus; pinned by a unit test).
- **Width is measured in painted cells, not allocated ones.** Some upstream
  layouts leave the rightmost column blank, so a diagram that fits was
  declared too wide. Differential class `slack` — 8 cases.
- **Grapheme clusters measure and paint as one unit** (post-cutoff). Fixes
  emoji and combining sequences overflowing their boxes; `Intl.Segmenter`
  replaced ~60 lines of hand-written clustering. Standalone zero-width
  characters are dropped rather than given a cell.
- **Box outlines are `border`, not `edge`.** Upstream classifies box corners as
  border and the sides as edge, which renders every box two-tone under any
  theme where the two differ.
- **Empty outer canvas rows are omitted.** Interior empty rows remain and emit
  no spans. Differential class `trimmed` — 410 cases.
- **Literal control characters are stripped at both entry points.** They
  measure one column and paint none; NUL collides with the `CONT` sentinel;
  ESC injects ANSI into scrollback.
- **Semantic span roles** instead of ratatui `Line`/`Span` + `MermaidStyles`.
- **`:::` tags and `class`/`classDef` statements are captured, not mishandled.**
  Upstream corrupts the parse everywhere `:::` can appear (drops the edge in
  `A:::x --> B`, leaks the tag into state names, declares `Animal:::hot`);
  the port attaches the class to the node (flowchart), or swallows the tag
  (state/class statement-level), and surfaces `classDef`s. No differential
  case exercises `:::`.

## Verification

`bun run differential` renders ~7180 cases through both the Rust original and
this port. It classifies each difference and **fails only on a regression** —
a case that diverges for a reason not on the deviations list above.

`run.ts` holds a `renderBounded` that reapplies upstream's `max_width` gate,
since `render` no longer has one; that shim lives there rather than in `src`
precisely because it is upstream's behaviour and not the port's.

Current state: 4274 identical, 2353 expected (clustering), 135 lenient
(statements dropped / caps truncated where upstream refused), 0 header,
8 slack (painted vs allocated width), 410 trimmed (empty outer rows),
0 regressions.

Commit `617cbf3` was the fidelity cutoff: up to there the port matched upstream
byte for byte on all 7180 cases. Divergence after it is deliberate and listed
above. See `tools/README.md` for how to run it.

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

- **`sourceBox` can exceed its `maxWidth`.** The body chunks to
  `max(8, maxWidth - 4)`, and the ` mermaid: <kind> ` title is never truncated,
  so a long first token sets a floor. It reports its own `width`, so a caller
  that cares can check. Left as-is: nothing useful renders that narrow.
- **An HTML entity in an unquoted label truncates the statement.**
  `splitStatements` treats `;` outside double quotes as a statement separator,
  so `A -->|go&#160;| B` splits mid-entity and the edge is dropped. Quoting the
  label works; mermaid proper wants special characters quoted anyway.
- **ER entity aliases with spaces are not parsed.** `a["Bank Account"]` splits
  on the internal space before the relationship tokens are read, so the
  statement drops (with a warning). Single-word aliases (`p[Person]`) work.

## Porting notes

- **`noUncheckedIndexedAccess` is off.** Rust distinguishes `chars[i]` (panics,
  so always guarded) from `chars.get(i)` (returns `Option`, branched on). TS's
  `arr[i] === undefined` reproduces the `.get()` case exactly, and the guarded
  cases are already guarded.
- **Saturating arithmetic.** Rust `usize` never goes negative; `saturating_sub`
  is spelled `sat(a, b)` here.
- **Integer division.** `half()` and `Math.ceil` stand in for `/ 2` and
  `div_ceil(2)`.
- **`asciiLower`/`asciiUpper`**, not `toLowerCase`. Rust's
  `to_ascii_lowercase` preserves length; `'İ'.toLowerCase()` does not, which
  would desync the offsets `parseNoteAnchor` slices with.
- **Char arrays.** Where Rust iterates `Vec<char>`, the port uses `[...s]` so
  indices are code points, not UTF-16 units.
- Control characters are written as `String.fromCharCode(n)`, never as literals
  in source — the `CONT` sentinel is NUL and would otherwise be invisible.

## Tests

191 tests. `test/render.test.ts`, `test/parse.test.ts`, `test/layout.test.ts`
and `test/labels.test.ts` descend from the upstream `mod tests` (intent
preserved; updated where behaviour deliberately diverged). `test/width.test.ts`
and `test/spans.test.ts` are new — the latter covers the span contract, which
upstream has no equivalent of.

The unit suite alone is not sufficient: it passed while four width bugs were
live. `bun run differential` is what actually pins fidelity.

## Tooling

bun (runtime + test runner + workspace), tsgo (typecheck + emit), biome
(lint + format, configured at the repo root). No runtime dependencies.
Root scripts: `test`, `check`, `fix`, `typecheck`, `differential`; package
scripts: `build`, `gen:width`, `gen:demo`, `release`, `prepublishOnly`.

## Releasing

Writing changelog entries and cutting the release are deliberately separate.
`/cl` only audits `## [Unreleased]` (in `packages/lovely-mermaid/CHANGELOG.md`)
against the commits since the last tag; everything mechanical lives in
`bun run release [patch|minor|major|x.y.z]` (run from `packages/lovely-mermaid`;
`--no-push` to stop at the tag), which refuses a dirty tree or an empty
`[Unreleased]`, rolls the changelog over, bumps `package.json`, runs
`prepublishOnly` and `pm pack`, commits, tags and pushes, then waits for CI to
stage the version on npm and approves it with a prompted 2FA code
(`npm stage approve --otp`; stage ids are UUIDs from `npm stage list --json`).
Being a script rather than an agent is what makes its unattended push
acceptable — and the OTP prompt keeps the actual publish manual.

That tag push is the only trigger for `publish.yml` (tags with a prerelease
suffix are skipped). It checks the tag against the package's `package.json`,
runs check, typecheck, test and build as explicit steps (build and the staging
step run with `working-directory: packages/lovely-mermaid`), then **stages**
the package (`npm stage publish`) through npm trusted publishing with OIDC and
`--provenance`; `--ignore-scripts` keeps `prepublishOnly` from repeating that
work. Staging is what reconciles provenance with a human gate: CI's OIDC build
carries the attestation, but the version only becomes installable after a
maintainer approves it with 2FA. The trusted publisher on npm must be
restricted to stage-only so a compromised workflow cannot publish directly —
and it must be (re)created for the `lovely-mermaid` package name; the old
`grok-mermaid` publisher does not carry over. A second job creates the GitHub
Release with the notes sliced out of `CHANGELOG.md`, gated on the staging
succeeding. A version already on npm is skipped rather than failing, which is
what lets a release that died partway be re-run; a staged but unapproved
version is invisible to that check and fails the re-stage instead.

The push is therefore the point of no return, which is what `--no-push` is for.
Release actions and tool versions are pinned.

npm's trusted publisher matches on the workflow **filename**, so renaming
`publish.yml` silently breaks publishing: the OIDC exchange finds nothing, npm
falls back to the empty `_authToken` that `setup-node` writes, and the registry
answers `PUT` with a 404 rather than a 403. A 404 on publish means unauthorized,
not missing.
