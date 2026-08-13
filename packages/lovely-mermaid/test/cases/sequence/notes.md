A note over two participants renders a box between them.

```mermaid
sequenceDiagram
  A->>B: hi
  Note over A,B: happy path
```

```text
┌───┐    ┌───┐
│ A │    │ B │
└─┬─┘    └─┬─┘
  │        │
  │   hi   │
  ├───────▶│
  │        │
┌────────────┐
│ happy path │
└────────────┘
  │        │
┌─┴─┐    ┌─┴─┐
│ A │    │ B │
└───┘    └───┘
```

A solo note over one participant.

```mermaid
sequenceDiagram
  Alice->>Bob: hi
  Note over Alice: solo note
```

```text
┌───────┐  ┌─────┐
│ Alice │  │ Bob │
└───┬───┘  └──┬──┘
    │         │
    │   hi    │
    ├────────▶│
    │         │
┌───────────┐ │
│ solo note │ │
└───────────┘ │
    │         │
┌───┴───┐  ┌──┴──┐
│ Alice │  │ Bob │
└───────┘  └─────┘
```
