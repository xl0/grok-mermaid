A back edge between adjacent ranks returns locally beside the forward
edge; one skipping ranks goes around through the side lane.

```mermaid
graph TD
  A --> B
  B --> C
  B --> A
  C --> A
```

```text
 ┌───┐
 │ A │◄┐
 └─┬─┘ │
   │▲  │
   ▼│  │
 ┌──┴┐ │
 │ B │ │
 └─┬─┘ │
   │   │
   ▼   │
 ┌───┐ │
 │ C ├─┘
 └───┘
```

Adjacent-rank back edges return locally at every step of a chain.

```mermaid
graph TD
  A --> B
  B --> C
  B --> A
  C --> B
```

```text
 ┌───┐
 │ A │
 └─┬─┘
   │▲
   ▼│
 ┌──┴┐
 │ B │
 └─┬─┘
   │▲
   ▼│
 ┌──┴┐
 │ C │
 └───┘
```
