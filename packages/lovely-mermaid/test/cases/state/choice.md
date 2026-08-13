A `<<choice>>` state renders as a diamond.

```mermaid
stateDiagram-v2
  state c <<choice>>
  A --> c
  c --> B: yes
  c --> D: no
```

```text
     ╭───╮
     │ A │
     ╰─┬─╯
       │
       ▼
     ╭───╮
     │ c │
     ╰─┬─╯
   ┌───┴───┐
   ▼yes    ▼no
 ╭───╮   ╭───╮
 │ B │   │ D │
 ╰───╯   ╰───╯
```
