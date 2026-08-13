A piped edge label renders on the edge.

```mermaid
graph TD
  A -->|yes| B
```

```text
 ┌───┐
 │ A │
 └─┬─┘
   │
   ▼yes
 ┌───┐
 │ B │
 └───┘
```

An undirected labelled link draws no arrowhead.

```mermaid
graph TD
  A ---|maybe| B
```

```text
 ┌───┐
 │ A │
 └─┬─┘
   │
   │maybe
 ┌───┐
 │ B │
 └───┘
```

The dotted inline-label form renders dashed.

```mermaid
graph LR
  A -. maybe .-> B
```

```text
┌───┐ maybe  ┌───┐
│ A ├╌╌╌╌╌╌╌▶│ B │
└───┘        └───┘
```

Inline labels that start with `o` or `x` are labels, not edge markers.

```mermaid
graph TD
  A -- no exit --> B
```

```text
 ┌───┐
 │ A │
 └─┬─┘
   │
   ▼no exit
 ┌───┐
 │ B │
 └───┘
```

```mermaid
graph TD
  A -- or else --> B
```

```text
 ┌───┐
 │ A │
 └─┬─┘
   │
   ▼or else
 ┌───┐
 │ B │
 └───┘
```
