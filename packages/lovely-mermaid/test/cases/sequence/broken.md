An unknown statement is dropped with a warning, not fatal.

```mermaid
sequenceDiagram
  A->>B: hi
  garbage statement here
```

```text
┌───┐  ┌───┐
│ A │  │ B │
└─┬─┘  └─┬─┘
  │      │
  │  hi  │
  ├─────▶│
  │      │
┌─┴─┐  ┌─┴─┐
│ A │  │ B │
└───┘  └───┘
```

```warnings
dropped, unreadable statement: "garbage statement here"
```

An arrow with no sender refuses.

```mermaid
sequenceDiagram
  ->>B: orphan
```

(null)
