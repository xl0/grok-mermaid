A `:::class` tag is swallowed and the edge survives, spaced or not.

```mermaid
flowchart TD
  A:::hot --> B
  classDef hot fill:#f00
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

```mermaid
flowchart LR
  A:::my-class --> B
```

```text
┌───┐    ┌───┐
│ A ├───▶│ B │
└───┘    └───┘
```

```mermaid
flowchart LR
  A:::x-->B
```

```text
┌───┐    ┌───┐
│ A ├───▶│ B │
└───┘    └───┘
```
