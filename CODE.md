# Code

TypeScript port of the terminal Mermaid renderer from `xai-org/grok-build`
(`crates/codegen/xai-grok-markdown/src/mermaid.rs`). Reference checkout lives at
`~/.cache/checkouts/github.com/xai-org/grok-build`.

## Layout

```
src/
  index.ts       public entry: render(), re-exported types
  types.ts       Cls / Span / MermaidArt / RenderOptions
```

## Public API

`render(src, { maxWidth })` returns `{ plain, styled }` or `null` for blank
input. `plain[i]` and `styled[i]` are the same row; `plain` is right-trimmed,
`styled` is that row split into `{ text, cls }` runs.

`Cls` is semantic (`border`/`text`/`edge`/`edgeLabel`/`title`/`hint`/`none`),
never a colour. This replaces the Rust `MermaidStyles` struct: layout no longer
depends on the theme, so a render survives a theme change and is plain JSON
(worker-transferable).

## Porting notes

- **`noUncheckedIndexedAccess` is off.** The Rust distinguishes `chars[i]`
  (panics, always guarded) from `chars.get(i)` (returns `Option`, branched on).
  TS's `arr[i] === undefined` reproduces the `.get()` case exactly, and the
  guarded cases are already guarded. Enabling the flag would mean ~500 `!`
  assertions for no safety gained.
- Rust `usize` saturating arithmetic (`saturating_sub`, `abs_diff`) has no TS
  equivalent — subtraction that could go negative must be clamped explicitly.
  Unclamped, a negative index silently reads `undefined` instead of behaving
  like the original.

## Tooling

bun (runtime + test runner), tsgo (typecheck + emit), biome (lint + format).
No runtime dependencies.
