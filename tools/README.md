# tools

Development-only; nothing here ships in the published package or is needed
to build or test the library. Needs a Rust toolchain
(`rustup default stable`).

The `differential` harness that once lived here — rendering a corpus through
both the Rust original and the port, failing on unclassified divergence —
retired once fidelity stopped being the goal: every improvement was paying a
divergence-classifier tax. Its corpus lives on as
`packages/lovely-mermaid/test/corpus.ts`, swept for crash-safety and the
span/width invariants by the normal test suite.

## `width-oracle`

Prints per-code-point display widths straight from the `unicode-width` crate,
pinned to the version grok-build resolves. `bun run gen:width` consumes it to
regenerate `src/width-data.ts`.

The table is committed, so this only needs running when bumping Unicode or the
crate version. Deriving those widths from the UCD by hand looks easy and is
wrong in the tail: `U+17D8` is three columns, `U+2D7F` is one despite being a
combining mark, and the zero-width set is `Default_Ignorable ∪ Grapheme_Extend
∪ Hangul V/T ∪ …` rather than `Mn|Me|Cf`.
