Entity aliases render their labels, spaces included.

```mermaid
erDiagram
  p[Person] ||--o{ a["Bank Account"] : owns
```

```text
   ┌────────┐
   │ Person │
   └────┬───┘
        │1
        │owns
        │*
┌──────────────┐
│ Bank Account │
└──────────────┘
```

An aliased entity keeps its attributes.

```mermaid
erDiagram
  a["Bank Account"] {
    string iban
  }
  a ||--|| p[Person] : held by
```

```text
┌──────────────┐
│ Bank Account │
├──────────────┤
│ string iban  │
└───────┬──────┘
        │1
        │held by
        │1
   ┌────────┐
   │ Person │
   └────────┘
```
