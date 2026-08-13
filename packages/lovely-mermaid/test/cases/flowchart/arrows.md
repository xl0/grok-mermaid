A bidirectional link draws both arrowheads.

```mermaid
flowchart LR
  A <--> B
```

```text
┌───┐    ┌───┐
│ A ◄───▶│ B │
└───┘    └───┘
```

```mermaid
graph TD
  A <--> B
```

```text
 ┌───┐
 │ A │
 └─▲─┘
   │
   ▼
 ┌───┐
 │ B │
 └───┘
```

A reversed arrow ranks the source above the target.

```mermaid
graph TD
  A <-- B
```

```text
 ┌───┐
 │ B │
 └─┬─┘
   │
   ▼
 ┌───┐
 │ A │
 └───┘
```

Circle and cross endings decorate the target end; the letters do not
become phantom nodes.

```mermaid
graph TD
  A --o B
  C --x D
```

```text
 ┌───┐   ┌───┐
 │ A │   │ C │
 └─┬─┘   └─┬─┘
   │       │
   o       ×
 ┌───┐   ┌───┐
 │ B │   │ D │
 └───┘   └───┘
```
