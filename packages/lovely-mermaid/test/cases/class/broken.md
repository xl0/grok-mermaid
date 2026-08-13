An unknown statement is dropped with a warning, not fatal.

```mermaid
classDiagram
  A --> B
  total garbage here
```

```text
 ┌───┐
 │ A │
 └─┬─┘
   │
   ▼
 ┌───┐
 │ B │
 └───┘
```

```warnings
dropped, unreadable statement: "total garbage here"
```
