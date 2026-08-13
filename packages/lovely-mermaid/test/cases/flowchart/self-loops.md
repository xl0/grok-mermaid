A self loop renders below the box, arrow pointing back up.

```mermaid
graph TD
  A --> A
```

```text
 ┌─────┐
 │  A  │
 └───┬─┘
     │▲
     ╰╯
```

```mermaid
graph TD
  A -->|again| A
```

```text
         ┌─────┐
         │  A  │
         └───┬─┘
             │▲  again
             ╰╯
```

A self loop coexists with a forward edge without crossings.

```mermaid
graph TD
  A --> A
  A --> B
```

```text
 ┌─────┐
 │  A  │
 └──┬┬─┘
    ││▲
    │╰╯
    │
    ▼
  ┌───┐
  │ B │
  └───┘
```

BT flips the loop above the box; LR keeps it below.

```mermaid
flowchart BT
  A --> A
  A --> B
```

```text
  ┌───┐
  │ B │
  └───┘
    ▲
    │
    │╭╮
    ││▼
 ┌──┴┴─┐
 │  A  │
 └─────┘
```

```mermaid
flowchart LR
  A --> A
  A --> B
```

```text
┌─────┐
│  A  ├┐   ┌───┐
└───┬─┘└──▶│ B │
    │▲     └───┘
    ╰╯
```
