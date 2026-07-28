# tools

Development-only. Neither directory ships in the published package, and
neither is needed to build or test the library — both exist to keep the port
honest against the Rust original.

Both need a Rust toolchain (`rustup default stable`).

## `width-oracle`

Prints per-code-point display widths straight from the `unicode-width` crate,
pinned to the version grok-build resolves. `bun run gen:width` consumes it to
regenerate `src/width-data.ts`.

The table is committed, so this only needs running when bumping Unicode or the
crate version. Deriving those widths from the UCD by hand looks easy and is
wrong in the tail: `U+17D8` is three columns, `U+2D7F` is one despite being a
combining mark, and the zero-width set is `Default_Ignorable ∪ Grapheme_Extend
∪ Hangul V/T ∪ …` rather than `Mn|Me|Cf`.

## `differential`

Renders a corpus through both the Rust original and this port, and fails on
any case where the plain output differs.

```sh
bun run differential
# GROK_BUILD=/path/to/grok-build bun run differential
```

It copies `mermaid.rs` out of a grok-build checkout at run time rather than
vendoring it, so this repo carries no copy of upstream's source. By default it
looks in `~/.cache/checkouts/github.com/xai-org/grok-build`.

The corpus is every hand-written test source, plus width and emoji edge cases,
plus deterministic fuzz, each at ten widths — about 7k cases. It found four
real bugs that the ported unit tests did not:

- `UnicodeWidthStr` charges a control character one column while
  `UnicodeWidthChar` reports zero; the port had collapsed the two, so any label
  or source line containing a tab measured short.
- `U+00AD` SOFT HYPHEN is zero-width, not one.
- Rust's `str::lines()` drops the final empty line when input ends in a
  newline; `String.split` keeps it, adding a blank row inside fallback boxes.
- Emoji ZWJ sequences, skin-tone modifiers, `FE0F` promotions, keycaps and
  regional-indicator pairs each measure as one 2-column cluster.

Extend `corpus.ts` when touching layout or width handling.
