Attributes elide past the cap with an ellipsis row.

```mermaid
erDiagram
  BIG {
    int f0
    int f1
    int f2
    int f3
    int f4
    int f5
    int f6
    int f7
    int f8
    int f9
    int f10
    int f11
  }
  BIG ||--|| OTHER : x
```

```text
┌────────┐
│  BIG   │
├────────┤
│ int f0 │
│ int f1 │
│ int f2 │
│ int f3 │
│ int f4 │
│ int f5 │
│ int f6 │
│ int f7 │
│ …      │
└────┬───┘
     │1
     │x
     │1
 ┌───────┐
 │ OTHER │
 └───────┘
```
