A minimal TD flowchart: boxes, labels, one arrow.

```mermaid
graph TD
  A[Start] --> B[End]
```

```text
 ┌───────┐
 │ Start │
 └───┬───┘
     │
     ▼
  ┌─────┐
  │ End │
  └─────┘
```

A chain stays a straight vertical spine — no corner glyphs.

```mermaid
graph TD
  A[aaaa] --> B[b] --> C[cccccccc]
```

```text
  ┌──────┐
  │ aaaa │
  └───┬──┘
      │
      ▼
    ┌───┐
    │ b │
    └─┬─┘
      │
      ▼
┌──────────┐
│ cccccccc │
└──────────┘
```

Node shapes: rectangle, diamond, circle.

```mermaid
flowchart LR
  A[ok] --> B{decide} --> C((done))
```

```text
┌────┐    ╔════════╗    ╭──────╮
│ ok ├───▶║ decide ╟───▶│ done │
└────┘    ╚════════╝    ╰──────╯
```
