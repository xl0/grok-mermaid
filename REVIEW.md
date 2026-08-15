# Review 2026-08-15

Question asked: deep sweep for unhandled corner cases, plus "would we build it
the same from scratch?" — the successor to `REDESIGN.md` (executed, deleted;
`git show fcb308f:REDESIGN.md`) and `REWORK.md`. Every behavioral finding below
was reproduced against `src/` with bun; disproven candidates are recorded under
*Verified solid* so the coverage isn't re-run.

Balance rule applied throughout: this is a terminal renderer — ugly-but-legible
is acceptable, silently-wrong-structure is not. The high findings are all the
latter.

## Verdict from scratch

A rewrite would reproduce ~90% of the design. Explicitly keep: direction-bit
canvas (absorbed gitgraph `┼`, double-tees, activations unmodified — the
strongest evidence for it), registry-as-data, Role/classes/classDefs split,
width-reported-not-enforced, grapheme cluster as the unit of measure *and*
paint, BT/RL as flips, sequence's own model, the deliberately-unmerged
`placeTd`/`placeLr` pair, golden markdown files as a mermaid-vs-ours gallery.

The one genuine design debt: **quote scanning still lives in five places**
(`splitStatements`, `splitTop`, `quoteMask`, flowchart `readShape`,
`readAtShape`) despite `statements.ts` being declared the one home — and bugs
2, 4, 5 below are all fresh instances of exactly that drift. Consolidate
opportunistically when touching a scanner; don't campaign.

## Bugs

### High — silently wrong structure, no warning

- [x] **Flowchart ids can't contain `-`.** `flowchart.ts` id scan stops at the
      first `-`, so `step-1-->step-2` renders a *self-loop on `step` labelled
      `1`* plus a stray node `2`; `my-node[Label] --> B` turns the id tail into
      an edge label. Kebab-case ids are everywhere; mermaid accepts them, and
      state diagrams already do (trailing-dash trim) — inter-grammar
      inconsistency. Fix: accept `-` when the next char is an id char, so
      `-->` / `-.` / `==` still terminate the id.

- [x] **`class Animal["Label"]` (mermaid ≥10.1) vanishes or forks.**
      `class.ts` `class` branch. Label with spaces → the name fails the
      space test, routes into `parseClassAssign`, *whole diagram returns
      `null` with zero warnings*. No-space label → two boxes, `A["X"]` and
      `A`. Fix: peel a quote-aware `[...]` label off the name before the
      space test, route through `nodeLabel`.

- [x] **BT flip reverses multi-row box content.** `flipVertical` mirrors rows
      wholesale: wrapped labels read bottom-up, class compartments invert
      (`+eat()` above `+int age`, title compartment at the bottom), composite
      frame titles land on the bottom border. `flipHorizontal` un-reverses
      text runs; vertical has no counterpart, and a post-flip fixup can't work
      (the canvas no longer knows box extents). Fix: make `drawBox` /
      `drawClassBox` / `drawFrame` orientation-aware pre-flip — emit wrapped
      lines and sections in reverse order, frame title on the bottom border,
      when `dir === 'up'`.

- [x] **State transition label containing `-->`.** `parseTransition` chains on
      every `-->` with no quote awareness: `A --> B: go "x --> y"` → label
      `go "x` plus phantom node `y"`. Mermaid: after the colon it's all label.
      Fix: locate the label colon first (`splitColon`), only chain on arrows
      before it.

- [x] **Back-edge lane approach crosses a sibling box** (found in the wild via
      the demo). Fixed for the reported class by routing adjacent-rank back
      edges *locally* through the band beside their forward siblings (what
      mermaid draws), TD/BT only — LR boxes are three rows tall, no room to
      offset off the centre row, so LR/RL keep the lane. The left-lane strip
      below was NOT built: with adjacent-back edges out of the lanes, the
      remaining collision needs two multi-rank lane edges in one rank —
      revisit only if it shows up in practice. With `B -->|yes| C` / `B -->|no| D` / `E -->|fail| C` /
      `D --> F`: the fail back edge climbs the right lane strip and runs
      horizontally at C's row into C's right border — straight through D's
      box. `occupied` suppresses the bits inside, so the segment re-emerges on
      both sides and *fabricates* two edges: `◄───│ Answer directly ├` reads
      as D→C, and D's real skip-edge exit merges with the crossing on the
      same row. The "lane endpoints order last in rank" heuristic can't help:
      C and D are both lane endpoints, so whichever sits left gets crossed.
      Right-only lanes make this collision unavoidable — the fix is a **left
      lane strip**:
      1. Side chooser in `laneSpans`/track assignment: an edge whose approach
         row would cross another box goes left (or simpler: target in the left
         half of its rank → left). Two span sets, `assignTracks` each.
      2. Placement offset: a left strip inserts columns *before* content, so
         every x (centers, placed, buses) shifts by `leftCount + 1` — the
         fiddly part; everything today assumes content starts at x=0.
      3. Mirrored `routeBack`: exit the from-node's left border, ride the left
         lane, enter the target's left border; label placement mirrored.
      4. Ordering heuristic becomes side-aware: left-lane endpoints order
         *first* in their rank.
      BT comes free (vertical flip preserves left/right). LR/RL want the
      analogous top strip in `placeLr`/`routeBackLr`; roughly doubles the
      work, can follow separately. ~100–150 lines for TD/BT.

### Medium

- [x] **Sequence op scan matches inside hyphenated tokens.** Position-first
      scan hits `-x` in `pre-x->>B: hi` → invents participant `>>B` with a
      cross head, no warning. Mermaid rejects the source; drop-with-warning is
      fine, inventing participants is not. Fix: require a boundary after
      `-x`/`--x`/`-)`/`--)` (next char not `-`/`>`).
- [x] **ER quoted entity names paint their quotes.** `"ORDER ITEM" ||--o{ …`
      → box titled `"ORDER ITEM"`. Strip quotes for the label, keep the quoted
      token as identity. Related: streamed unclosed alias `p["Person` gets no
      unterminated-bracket warning (flowchart warns; ER's local `]`-trim
      reimplementation doesn't).
- [x] **Tabs survive into pie/timeline/mindmap/gitgraph output.** `\t` is
      exempt from `stripControls`, measured 1 column, but the terminal jumps
      to a tab stop → bar/percent/dash columns misalign and `width`
      under-reports (the one contract callers act on). The source box already
      expands tabs for exactly this reason; flowchart labels are immune via
      wrap-collapse. Fix: normalize `\t` → space on the raw-line label path
      (`cleanLabel`/`fitLabel`).
- [x] **Multi-edges between one pair collapse to one** — labels now join
      (`one / two`); distinct parallel tracks judged not worth the geometry. Endpoint-sharing track
      packing puts identical routes on the same cells; `placeLabel` blocks on
      the first label — `A -->|one| B` ×3 renders one edge labelled `one`,
      `two`/`three` gone, no warning. Minimum: warn or join labels
      (`one / two / three`); full fix: distinct tracks per duplicate.

### Low

- [x] `flipGlyphH`/`flipGlyphV` corrupt arrows inside user text: RL turns
      `A[go ◄ left]` into `go ▶ left`. Skip glyph-flip for
      `text`/`edgeLabel`/`title` cells.
- [x] Repeated state descriptions overwrite (`s1 : a` then `s1 : b` → only
      `b`); mermaid stacks them. Fixed by joining + wrap (no multi-line label
      machinery needed).
- [x] Cap-hit flowchart statements warn twice: three direct `warnings.push`
      sites in `parseStatement` bypass `Graph.drop`'s post-truncation
      suppression, so `dropped, does not start with a node` appears alongside
      `diagram truncated`. Gate on `graph.truncated === null`.
- [x] gitgraph `branch "feat x"` keeps the opening quote in the head label
      (`words()[0]`). Take the quoted token whole.
- [x] timeline: bare period line (`2020` with no `:`) is dropped; mermaid
      renders an event-less period. Emit the row.
- [x] pie: `"a" :` parses as 0% (`Number('')` = 0); `0x10` also slips
      through. Decided: keep — the streaming-friendly read (a value being
      typed) outweighs mermaid parity here.
- [x] Flowchart `|`-labels aren't quote-aware: `A -->|"a|b"| B` → label `"a`
      plus node `b`. At least it warns; recording as shared-helper drift.
- [x] BT self-loop: return `▼` sits on a border cell with no tee, `┴┴`
      adjacency. Decided: keep — TD draws the same un-teed return; parity,
      not a BT defect.

## Proposals beyond bug fixes

- [x] **Streaming-prefix invariant sweep as a test.** The library's central
      argument is streaming, and manual per-character prefix sweeps over five
      complex sources held (zero throws, sane partials) — but nothing in
      `test/` pins it. Sweep prefixes of the golden-corpus sources asserting
      no-throw + styled-reconstructs-plain. Cheap; reuses `corpus.test.ts`
      machinery. Do now.
- [ ] **Typed warnings at the next major:** `{kind: 'dropped' | 'truncated' |
      'unclosed', text}`. A streaming TUI legitimately treats permanent
      truncation differently from a transient unclosed bracket; today it must
      string-match three shapes. Construction sites are few (`Graph.drop`,
      the truncation push, flowchart bracket warnings). Related: `null` is
      four answers (blank / unknown grammar / nothing parsed / cell cap) —
      only worth breaking if a caller actually asks; `diagramKind` covers the
      common case.
- [ ] **`Span.node`** — the per-cell tag/href stamping already answers "which
      node painted this"; carrying the node id too is nearly free and unlocks
      hover/fold/source-mapping in TUIs. YAGNI until a caller exists; noting
      that the mechanism was built so this stays cheap. Full geometry
      (`art.nodes` rects) fights the blit/flip pipeline — leave unless
      demanded.
- [x] One ANSI-layer golden file (escaped SGR) to pin the `toAnsi`
      theme×classDef merge matrix, currently unit-only.
- Note, no action: `noUncheckedIndexedAccess: off` was justified by the Rust
  port's inherited guards; pie/mindmap/timeline/gitgraph were written fresh
  without that ancestry. A greenfield project would turn it on day one;
  enabling now is a false-positive slog.
- Evaluated and rejected: splitting `layout.ts` (banner sections suffice; the
  real extension seam is `NodeExtra`, which is small and good); forcing
  sequence through `Graph` (its constraint-solver shape is genuinely
  different); unifying the three parsing idioms (per REDESIGN, still right).

## Verified solid

Recorded so the next review doesn't re-check: span contract (`styled`
reconstructs `plain`, `width` = widest painted row) under CJK/emoji/flips/
cardinalities; OSC 8 injection closed (C0+DEL+C1 stripped, entity decode
refuses controls, hrefs never entity-decoded); SGR self-contained per span, no
bleed, nests inside OSC 8; bidi controls (RLO/LRO/RLM) width-0 → dropped,
cannot reorder output; lone surrogates tolerated end-to-end; ZWJ families /
flags / keycaps / skin tones / combining-on-CJK measure per spec; caps
truncate cleanly and worst-case cap-sized layouts stay under ~180 ms
(`countCrossings` O(E²)×8 is bounded by MAX_EDGES); `sat()` clamps every
traced negative-coordinate path; sequence activations (nested, unclosed,
through-note `╫`), notes, alt/else dividers, autonumber; subgraph
cross-boundary edge attachment, 6-deep nesting, empty subgraphs; per-statement
drops don't corrupt neighbours in any strict grammar; streaming prefix sweeps
of five complex sources throw nothing.
