A skip edge routes around the intermediate box and re-enters through the
target's top, beside the forward arrival.

```mermaid
graph TD
  A --> B
  B --> C
  A --> C
```

```text
 ┌───┐
 │ A ├─┐
 └─┬─┘ │
   │   │
   ▼   │
 ┌───┐ │
 │ B │ │
 └─┬─┘ │
  ┌┼───┘
  ▼▼
 ┌───┐
 │ C │
 └───┘
```

An avoidable crossing is untangled by reordering.

```mermaid
graph TD
  C[ccc]
  D[ddd]
  A --> D
  B --> C
```

```text
  ┌───┐     ┌───┐
  │ A │     │ B │
  └─┬─┘     └─┬─┘
    │         │
    ▼         ▼
 ┌─────┐   ┌─────┐
 │ ddd │   │ ccc │
 └─────┘   └─────┘
```

An unavoidable crossing claims a separate bus row.

```mermaid
graph TD
  A --> D[ddd]
  A --> C[ccc]
  B --> C
  B --> D
```

```text
   ┌───┐   ┌───┐
   │ A │   │ B │
   └┬┬─┘   └─┬┬┘
    ├┼───────┘│
    │└────────┤
    ▼         ▼
 ┌─────┐   ┌─────┐
 │ ddd │   │ ccc │
 └─────┘   └─────┘
```

A fan-out keeps a single bus row; a merge draws a single arrowhead.

```mermaid
graph TD
  A --> C[ccc]
  A --> D[ddd]
```

```text
       ┌───┐
       │ A │
       └─┬─┘
    ┌────┴────┐
    ▼         ▼
 ┌─────┐   ┌─────┐
 │ ccc │   │ ddd │
 └─────┘   └─────┘
```

```mermaid
graph TD
  A[aaa] --> D[ddddddd]
  B[bb] --> D
  C[ccccc] --> D
```

```text
 ┌─────┐  ┌────┐    ┌───────┐
 │ aaa │  │ bb │    │ ccccc │
 └──┬──┘  └───┬┘    └───┬───┘
    └─────────┼─────────┘
              ▼
         ┌─────────┐
         │ ddddddd │
         └─────────┘
```

`&` fans out the cross product, one arrowhead per target.

```mermaid
graph TD
  A & B --> C & D
```

```text
 ┌───┐   ┌───┐
 │ A │   │ B │
 └─┬─┘   └─┬─┘
   ├───────┤
   ├───────┤
   ▼       ▼
 ┌───┐   ┌───┐
 │ C │   │ D │
 └───┘   └───┘
```

A fan mid-chain continues from the whole group; a reversed arrow fans the
sources.

```mermaid
graph LR
  A & B --> C --> D
```

```text
┌───┐
│ A ├┐
└───┘│   ┌───┐    ┌───┐
     ├──▶│ C ├───▶│ D │
┌───┐│   └───┘    └───┘
│ B ├┘
└───┘
```

```mermaid
graph TD
  A & B <-- C
```

```text
     ┌───┐
     │ C │
     └─┬─┘
   ┌───┴───┐
   ▼       ▼
 ┌───┐   ┌───┐
 │ A │   │ B │
 └───┘   └───┘
```
