# Git graphs

Commit lanes in `git log --graph` style: newest on top, one column per
branch, splits and merges as connector rows.

```mermaid
gitGraph
  commit id: "c1"
  branch feature
  commit id: "c2"
  checkout main
  commit id: "c3"
  merge feature tag: "v1.0"
  commit id: "c5"
```

```text
●   c5 (main)
●   [v1.0] ⇐ feature
├─┐
● │ c3
│ ● c2 (feature)
├─┘
●   c1
```

A merge across an in-between lane crosses it rather than erasing it.

```mermaid
gitGraph
  commit id: "a"
  branch dev
  commit id: "b"
  checkout main
  branch hotfix
  commit id: "c"
  checkout main
  merge hotfix
  merge dev
```

```text
●     (main) ⇐ dev
├─┐
● │   ⇐ hotfix
├─┼─┐
│ │ ● c (hotfix)
│ ● │ b (dev)
├─┼─┘
├─┘
●     a
```
