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

An inline label may contain `=`, `.` or `-`, quoted or not — only a
closing operator (two link chars) ends it
([#2](https://github.com/xl0/lovely-mermaid/issues/2)).

```mermaid
flowchart TB
  A --"a=b"--> B
  B -- c-d.e --> C
```

```text
 ┌───┐
 │ A │
 └─┬─┘
   │
   ▼a=b
 ┌───┐
 │ B │
 └─┬─┘
   │
   ▼c-d.e
 ┌───┐
 │ C │
 └───┘
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
