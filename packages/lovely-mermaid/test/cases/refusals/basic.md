# Refusals

Diagram types this renderer does not draw return `null` — the caller shows
the source box.

```mermaid
gantt
  title Plan
  section A
  task :a1, 2024-01-01, 30d
```

(null)

Upstream accepts junk header suffixes like `stateDiagramFoo` by prefix
match; mermaid proper — and this port — reject them.

```mermaid
stateDiagramFoo
  A --> B
```

(null)
