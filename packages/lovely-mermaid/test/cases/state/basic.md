Start and end markers, rounded state boxes, a transition label.

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Running: start
  Running --> [*]
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
      ▼start
 ╭─────────╮
 │ Running │
 ╰────┬────╯
      │
      ▼
    ╭───╮
    │ ● │
    ╰───╯
```

The v1 header renders too.

```mermaid
stateDiagram
  A --> B
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

An alias and a description set the label.

```mermaid
stateDiagram-v2
  state "Waiting for input" as W
  s2 : waits patiently
  W --> s2
```

```text
 ╭───────────────────╮
 │ Waiting for input │
 ╰─────────┬─────────╯
           │
           ▼
  ╭─────────────────╮
  │ waits patiently │
  ╰─────────────────╯
```
