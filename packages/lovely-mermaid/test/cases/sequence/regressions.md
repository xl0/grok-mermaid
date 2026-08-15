# Sequence regressions

A note left of the first participant gets its own margin instead of painting
over the lifelines.

```mermaid
sequenceDiagram
  Note left of A: hello there
  A->>B: hi
```

```text
              ┌───┐  ┌───┐
              │ A │  │ B │
              └─┬─┘  └─┬─┘
                │      │
┌─────────────┐ │      │
│ hello there │ │      │
└─────────────┘ │      │
                │      │
                │  hi  │
                ├─────▶│
                │      │
              ┌─┴─┐  ┌─┴─┐
              │ A │  │ B │
              └───┘  └───┘
```
