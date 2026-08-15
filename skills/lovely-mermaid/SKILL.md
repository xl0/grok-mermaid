---
name: lovely-mermaid
description: Consult before emitting a ```mermaid block.
---

# Mermaid diagrams

```mermaid fences render as Unicode box-drawing art. Supported types:

- `flowchart` / `graph` — `TD`/`BT`/`LR`/`RL`, `subgraph` nesting, shapes
  (`[rect]`, `(round)`, `{diamond}`, v2 `A@{shape: cyl, label: "…"}`),
  `-->` / `-.->` / `==>` links, `o`/`x` end markers, `|edge labels|`.
- `stateDiagram-v2` — transitions, `[*]`, `<<choice>>`, `id : description`,
  composite `state X { … }` with `--` regions.
- `classDiagram` — member compartments, `<<annotations>>`, `~generics~`,
  all relation arrows, per-end `"cardinalities"`.
- `erDiagram` — entities, attributes, crow's-foot cardinalities, quoted
  aliases (`c["Credit Card"]`).
- `sequenceDiagram` — messages, activations (`->>+` / `-->>-`), notes,
  `loop`/`alt`/`opt`/`par` blocks, `autonumber`.
- `pie` — drawn as a labelled bar list; `showData` appends raw values.
- `mindmap` — the indentation tree, drawn with `├──` guides.
- `timeline` — `period : event : event` rows, `section` headers.
- `gitGraph` — `commit`/`branch`/`checkout`/`merge` with `id:`/`tag:`,
  drawn like `git log --graph`, newest on top.

Works everywhere: YAML frontmatter `title:`, CJK and emoji in labels.

Flowchart, state and class diagrams only: `:::class` tags +
`classDef name fill:#f96,color:#000` node colors. Flowchart/class only:
`click A "url"` / `link A "url"` become clickable OSC 8 hyperlinks.

Rules of thumb:

- Quote label text containing `:`, `;`, `#` or brackets.
- Other types (gantt, sankey, quadrant, …) fall back to displaying the block.
- Terminals are narrow: prefer `TD` for long chains, keep labels short.
