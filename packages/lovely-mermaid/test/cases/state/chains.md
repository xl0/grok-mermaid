A chained transition with markers and a trailing label.

```mermaid
stateDiagram-v2
  [*] --> A --> B: done
```

```text
 ╭───╮
 │ ● │
 ╰─┬─╯
   │
   ▼
 ╭───╮
 │ A │
 ╰─┬─╯
   │
   ▼done
 ╭───╮
 │ B │
 ╰───╯
```
