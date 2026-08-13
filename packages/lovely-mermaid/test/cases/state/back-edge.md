A back transition uses a lane, label included.

```mermaid
stateDiagram-v2
  A --> B
  B --> C
  C --> B: retry
```

```text
 ╭───╮
 │ A │
 ╰─┬─╯
   │
   ▼
 ╭───╮ retry
 │ B │◄──────┐
 ╰─┬─╯       │
   │         │
   ▼         │
 ╭───╮       │
 │ C ├───────┘
 ╰───╯
```
