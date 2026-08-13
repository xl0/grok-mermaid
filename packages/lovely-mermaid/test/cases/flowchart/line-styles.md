Dotted and thick lines render distinctly; a plain solid edge uses neither.

```mermaid
graph TD
  A -.-> B
```

```text
 ┌───┐
 │ A │
 └─┬─┘
   ╎
   ▼
 ┌───┐
 │ B │
 └───┘
```

```mermaid
graph TD
  A ==> B
```

```text
 ┌───┐
 │ A │
 └─┬─┘
   ┃
   ▼
 ┌───┐
 │ B │
 └───┘
```

Box borders stay light next to a thick edge, and a thick jog uses thick
corners.

```mermaid
graph TD
  A[aaaaaaa] ==> B
  A ==> C[ccccccc]
```

```text
   ┌─────────┐
   │ aaaaaaa │
   └────┬────┘
   ┏━━━━┻━━━━━┓
   ▼          ▼
 ┌───┐   ┌─────────┐
 │ B │   │ ccccccc │
 └───┘   └─────────┘
```

A mixed solid and dotted bus stays light.

```mermaid
graph TD
  A --> C
  B -.-> C
```

```text
 ┌───┐   ┌───┐
 │ A │   │ B │
 └─┬─┘   └─┬─┘
   └───┬╌╌╌┘
       ▼
     ┌───┐
     │ C │
     └───┘
```
