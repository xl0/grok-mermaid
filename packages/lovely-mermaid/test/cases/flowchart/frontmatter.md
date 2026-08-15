# Frontmatter

A YAML frontmatter block is part of the mermaid grammar; its `title:` is
drawn centred above the art and the rest is skipped.

```mermaid
---
title: Order flow
config:
  theme: forest
---
flowchart TD
  A --> B
```

```text
Order flow

 ┌───┐
 │ A │
 └─┬─┘
   │
   ▼
 ┌───┐
 │ B │
 └───┘
```
