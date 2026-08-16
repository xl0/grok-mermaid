A composite state renders as a titled frame; the inner `[*]` is scoped to
the frame.

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Active
  state Active {
    [*] --> Fetching
    Fetching --> Rendering
  }
  Active --> [*]
```

```text
       ╭───╮
       │ ● │
       ╰─┬─╯
         │
         ▼
     ╭──────╮
     │ Idle │
     ╰───┬──╯
         │
         ▼
┌ Active ────────┐
│      ╭───╮     │
│      │ ● │     │
│      ╰─┬─╯     │
│        │       │
│        ▼       │
│  ╭──────────╮  │
│  │ Fetching │  │
│  ╰─────┬────╯  │
│        │       │
│        ▼       │
│  ╭───────────╮ │
│  │ Rendering │ │
│  ╰───────────╯ │
└────────┬───────┘
         │
         ▼
       ╭───╮
       │ ● │
       ╰───╯
```

`--` splits a composite into unlabelled side-by-side regions.

```mermaid
stateDiagram-v2
  state Fork {
    A --> B
    --
    C --> D
  }
  Fork --> Done
```

```text
 ┌ Fork ───────────────────┐
 │ ┌────────┐   ┌────────┐ │
 │ │  ╭───╮ │   │  ╭───╮ │ │
 │ │  │ A │ │   │  │ C │ │ │
 │ │  ╰─┬─╯ │   │  ╰─┬─╯ │ │
 │ │    │   │   │    │   │ │
 │ │    ▼   │   │    ▼   │ │
 │ │  ╭───╮ │   │  ╭───╮ │ │
 │ │  │ B │ │   │  │ D │ │ │
 │ │  ╰───╯ │   │  ╰───╯ │ │
 │ └────────┘   └────────┘ │
 └────────────┬────────────┘
              │
              ▼
          ╭──────╮
          │ Done │
          ╰──────╯
```

A composite whose contents connect outward renders flat.

```mermaid
stateDiagram-v2
  state Active {
    A --> B
  }
  Active --> Done
```

```text
┌ Active ┐
│  ╭───╮ │
│  │ A │ │
│  ╰─┬─╯ │
│    │   │
│    ▼   │
│  ╭───╮ │
│  │ B │ │
│  ╰───╯ │
└────┬───┘
     │
     ▼
 ╭──────╮
 │ Done │
 ╰──────╯
```
