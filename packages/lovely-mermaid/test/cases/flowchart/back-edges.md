Back edges to one target share a lane.

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
   │   │
   ▼   │
 ┌───┐ │
 │ B ├─┤
 └─┬─┘ │
   │   │
   ▼   │
 ┌───┐ │
 │ C ├─┘
 └───┘
```

Back edges to different targets claim separate lanes.

```mermaid
graph TD
  A --> B
  B --> C
  B --> A
  C --> B
```

```text
 ┌───┐
 │ A │◄┐
 └─┬─┘ │
   │   │
   ▼   │
 ┌───┐ │
 │ B ├◄┴┐
 └─┬─┘  │
   │    │
   ▼    │
 ┌───┐  │
 │ C ├──┘
 └───┘
```
