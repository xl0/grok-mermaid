//! Emits per-code-point display widths straight from the `unicode-width`
//! crate, so the TypeScript table is exact by construction rather than
//! re-derived from the UCD by hand.
//!
//! Two widths differ per code point and the renderer depends on both:
//!   char - `UnicodeWidthChar::width(c).unwrap_or(0)`, used when painting
//!   str  - the width of that character alone in a string
//!
//! Output: `lo hi charWidth strWidth` per run, hex bounds, one run per line.

use unicode_width::{UnicodeWidthChar, UnicodeWidthStr};

fn widths(cp: u32) -> (u8, u8) {
    match char::from_u32(cp) {
        // Surrogates are not characters; width 1 keeps runs contiguous and
        // they can never appear in a Rust `str` anyway.
        None => (1, 1),
        Some(c) => (
            UnicodeWidthChar::width(c).unwrap_or(0) as u8,
            c.to_string().width() as u8,
        ),
    }
}

fn main() {
    let mut lo = 0u32;
    let mut cur = widths(0);
    for cp in 1..=0x10FFFFu32 {
        let w = widths(cp);
        if w != cur {
            println!("{:x} {:x} {} {}", lo, cp - 1, cur.0, cur.1);
            lo = cp;
            cur = w;
        }
    }
    println!("{:x} {:x} {} {}", lo, 0x10FFFFu32, cur.0, cur.1);
}
