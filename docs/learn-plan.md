# /learn — interactive layout topics (plan)

A series of demo pages, one topic each, teaching how layered graph layout
works to smart readers with no graph-drawing background. Every page mixes
prose with **live renders** (our own engine, per-figure ELK options) so every
claim is demonstrated, not illustrated. Each topic ends with a playground.

## Series roadmap (one page per topic, in pipeline order)

0. **Drawing graphs** (lesson 0) — layout has no canonical answer; aesthetic
   criteria; the algorithm families (force, stress, tree, orthogonal,
   packing, layered) with a same-graph-three-ways figure; "layer" = rank =
   row (org chart, not Photoshop); why direction forces acyclicity (the
   row-numbering contradiction); pipeline preview. Done.
1. **Cycle breaking** — done; reworked after review: no lesson-0 rehash, no
   basic warm-up figures, ELS stepper replaced by a drag-to-reorder linear
   arrangement widget (find the 1-reversal order; greedy's answer loadable),
   strategy zoo uses an engineered graph where GREEDY / DEPTH_FIRST /
   GREEDY_MODEL_ORDER give three different drawings (verified), subgraphs
   get a first-mention Term (full treatment stays in the clusters lesson),
   playground defaults to the zoo graph. Static figures are hand-drawn SVG
   mirroring verified engine output (rank bands + per-node tags: greedy
   score / DFS visit order / declaration order); the engine runs only in
   the playground.
2. Layering — in progress. Outline: (1) lede — input is a DAG, output is a
   rank per node, every edge strictly down, huge remaining freedom; (2) the
   three prices that can't all be minimized: height, total edge span, row
   width; (3) centerpiece widget — drag nodes vertically between rank
   bands on a fixed 6-node DAG, live counters (upward edges = invalid,
   total span, dummy count), dummy dots drawn where long edges cross
   bands, buttons load longest-path and min-span rankings (verified
   against ELK); (4) dummy nodes — every skipped rank becomes an invisible
   node that occupies a slot and must be routed around; delivers lesson
   1's "long edges quietly cost width" promise; spaghetti teaser for
   lesson 3; (5) strategy figures — hand SVG of engine output,
   NETWORK_SIMPLEX vs LONGEST_PATH on the widget graph, dummy dots shown,
   spans in captions; one-liners on COFFMAN_GRAHAM / MIN_WIDTH and the
   empirical note that width-targeting layerings often backfire (dummies
   dominate); (6) playground — build-pipeline DAG with slack, layering
   strategy select; (7) takeaways, next = crossing minimization. Ref
   cards: Gansner et al. 1993 (network simplex), Coffman & Graham 1972.
3. Crossing minimization — layer sweep, barycenter, why spaghetti is dummies.
4. Node placement — Brandes-Köpf vs linear segments, the width/symmetry trade.
5. Edge routing — channels, tracks, orthogonal vs polyline.
6. Compound graphs — INCLUDE_CHILDREN, piercing, cluster inflation.
7. The terminal grid — snapping, even widths, junction merging, labels.

Routes: `/learn` (index listing topics, done/upcoming) and
`/learn/<topic>`. Shared bits stay minimal — reuse `DiagramViewer`; a small
`Figure` wrapper (caption + fixed-height viewer with per-figure options) if
repetition demands it. Terminology goes in `$lib/learn/Term.svelte`
admonitions placed right after the paragraph of first use (dashed box: term
name + short definition). Paragraphs are written assuming the reader knows
the terms and NEVER refer to the admonitions ("see above", "those words need
to be solid") — the boxes are optional support, not part of the narrative.

Standalone: the lessons may become their own website. Never reference the
surrounding demo — its pages, UI ([opts] dropdown), or example corpus.
Referring to things on the lesson page itself (the playground, the live
figures) is fine.

Terminology: "layer" is the series' word for a row of nodes (matches
"layered layout" and the engine's options); "rank" appears only as a
noted graphviz synonym. Swept through lessons 0–2.

No invented shorthand: don't coin page-internal terms and lean on them
("tags:", "costs nothing globally", "the box frames it", "back-edge",
"pays double"). Every label a figure or caption relies on gets one plain
sentence of definition first ("The badge on each node is the one number
that strategy looked at"), and after that the same word is used
consistently. When a standard term exists (source, reversal, declaration
order), use it instead of a metaphor.

Tone: plain instructive register, with humor. Cheeky jokes and sarcasm are
welcome — as many as land. What is banned is the sales pitch: grand
summations ("that is the whole field in one sentence"), promises of
interestingness ("more interesting than it sounds"), superlative adjectives
doing an argument's job ("beautiful"), hyperbole posing as data ("half of
all real state machines"). The test: a joke laughs WITH the reader at the
material; a pitch tells the reader how to feel about it. Keep the first,
cut the second.

External sources get the same `Term` component with `href`: the name becomes
a link (marked ↗), the body a 1–2 line summary of what the source proves —
placed after the paragraph that cites it.

Medium rule: lesson 0 is pure SVG (hand-placed pill schematics + in-browser
elk/d3 runs rendered as SVG) — no terminal renderer there. Phase pages
(lesson 1+) demo the real engine; whether those render as terminal art or
SVG is an open question, decide per page.

## Page 1: Cycle breaking

Reader takeaway: *layered layout must temporarily reverse some edges; which
ones get reversed decides what sits above what; the strategies differ in
what they optimize, and "fewest reversals" is not the same as "reads
correctly".*

### Content outline

1. **The problem** (prose + 2 live figures)
   - Layered layout's first commitment: every edge points downward.
   - A cycle makes that impossible by definition — some edge must lose.
   - Figure A: acyclic chain renders top-down, all arrows down.
   - Figure B: add one back edge — render shows exactly one arrow pointing
     up. That edge was *reversed* during layout and restored at draw time.
   - Key vocabulary introduced casually: DAG, reversed/feedback edge.

2. **Reversal, not removal** (prose + tiny figure)
   - The edge still exists, still routes, still gets its arrowhead at the
     declared end — only the *layering phase* sees it flipped.
   - Why not delete: the edge must still be drawn, and its length still
     matters to the result.

3. **The formal problem, in one breath** (prose only)
   - "Choose the fewest edges to reverse" = minimum feedback arc set,
     NP-hard, so real engines use heuristics.
   - The linear-arrangement mental model: put all nodes on a line so that
     as few edges as possible point left. Left-pointing edges = reversals.
     This picture carries the whole page.

4. **Interactive: the greedy heuristic step by step** (the centerpiece)
   - Eades–Lin–Smyth in ~5 lines of pseudocode.
   - Stepper widget on a fixed 6-node graph with two overlapping cycles:
     - state shown as three zones: left sequence (sources), undecided pool
       (with live in/out degree chips), right sequence (sinks);
     - each step highlights which rule fired (sink? source? best
       out−in?) and moves one node;
     - at the end, an **arc diagram**: nodes on a line in the computed
       order, forward edges arcing above, reversed edges below in red.
   - Invite: "notice the algorithm never looked at your declaration order."

5. **The strategy zoo** (3 live figures, same source, different options)
   - The retry-loop graph (`start → attempt ⇄ failed? → give up`).
   - GREEDY: puts `failed?` on top — degree arithmetic says so
     (out−in: failed? +1, attempt −1). Correct by its own metric,
     wrong to a human reader.
   - DEPTH_FIRST: DFS from the entry; back edges get reversed; reads
     causally.
   - GREEDY_MODEL_ORDER: greedy with declaration-order tie-breaking;
     `attempt` stays on top because you typed it first.
   - Short note on MODEL_ORDER proper (reverses *every*
     declaration-backward edge, even acyclic ones — a reordering tool, not
     a cycle breaker) — one sentence, no figure.

6. **Where it bites in practice** (prose + 1 figure)
   - Cycles inside subgraphs: the same choice decides the *cluster's*
     internal order (live figure: retry loop inside a titled subgraph).
   - War story, 3 sentences: elkjs ≥ 0.11 crashes when a model-order
     strategy sits on a compound containing a cycle; we pre-break cycles
     ourselves in declaration order and hand ELK a DAG.

7. **Playground**
   - Textarea (initial source: the retry loop with a second nested cycle) +
     strategy select + live viewer. Prompt ideas: "make the loop render
     upside down", "add an edge that creates a second cycle and watch which
     strategy stays readable".

8. **Takeaways** (5 bullets, one line each)
   - One edge per cycle must render against the flow; strategies choose it.
   - Fewest reversals ≠ most readable; source order is information.
   - GREEDY is order-blind by design; model-order variants respect you.
   - The choice is per-diagram tunable (the `[opts]` dropdown everywhere).
   - Next topic: layering — what "downward" actually becomes.

### Implementation notes

- New routes: `learn/+page.svelte` (index), `learn/cycle-breaking/+page.svelte`.
- Figures: `DiagramViewer` in a fixed-height frame, `elkExtra` pinned per
  figure, `elkOn` always true; no global toolbar — each figure is
  self-contained, captioned.
- Stepper: implement ELS in ~30 lines in the page script, precompute the
  step list at init (pure, deterministic), UI is prev/next/reset over an
  index — no animation machinery. Arc diagram is a single inline SVG
  (`{#each}` over nodes/arcs), red-below for reversed.
- The stepper graph and every figure source verified against the real
  engine before the prose claims anything (figtest.ts already confirms the
  GREEDY inversion / DEPTH_FIRST / GREEDY_MODEL_ORDER story).
- Keep page CSS local and modest: prose column ~65ch, figures full-width,
  code in `<pre>`; dark theme only (matches the demo default).
