# State-diagram regressions

An extra dash in an arrow is tolerated.

```mermaid
stateDiagram-v2
  A ---> B
```

```text
 ╭───╮
 │ A │
 ╰─┬─╯
   │
   ▼
 ╭───╮
 │ B │
 ╰───╯
```

A description on a `<<choice>>` state keeps the diamond shape.

```mermaid
stateDiagram-v2
  state c <<choice>>
  c : pick a path
  A --> c
  c --> B
```

```text
      ╭───╮
      │ A │
      ╰─┬─╯
        │
        ▼
 ╔═════════════╗
 ║ pick a path ║
 ╚══════╤══════╝
        │
        ▼
      ╭───╮
      │ B │
      ╰───╯
```

The first `--` region divider reparents earlier members; the nested
composite must survive it.

```mermaid
stateDiagram-v2
  state Outer {
    state Inner {
      A --> B
    }
    --
    C
  }
```

```text
 ┌ Outer ────────────────┐
 │┌──────────┐           │
 ││ ┌ Inner ┐│           │
 ││ │ ╭───╮ ││           │
 ││ │ │ A │ ││   ┌──────┐│
 ││ │ ╰─┬─╯ ││   │ ╭───╮││
 ││ │   │   ││   │ │ C │││
 ││ │   ▼   ││   │ ╰───╯││
 ││ │ ╭───╮ ││   └──────┘│
 ││ │ │ B │ ││           │
 ││ │ ╰───╯ ││           │
 ││ └───────┘│           │
 │└──────────┘           │
 └───────────────────────┘
```

`:::` inside a quoted label is text, not a class tag.

```mermaid
stateDiagram-v2
  state "find a:::b thing" as S1
```

```text
╭──────────────────╮
│ find a:::b thing │
╰──────────────────╯
```
