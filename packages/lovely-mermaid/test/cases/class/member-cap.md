Members elide past the cap with an ellipsis row.

```mermaid
classDiagram
  class Big {
    +field0
    +field1
    +field2
    +field3
    +field4
    +field5
    +field6
    +field7
    +field8
    +field9
    +field10
    +field11
  }
  A --> Big
```

```text
    ┌───┐
    │ A │
    └─┬─┘
      │
      ▼
 ┌─────────┐
 │   Big   │
 ├─────────┤
 │ +field0 │
 │ +field1 │
 │ +field2 │
 │ +field3 │
 │ +field4 │
 │ +field5 │
 │ +field6 │
 │ +field7 │
 │ …       │
 └─────────┘
```
