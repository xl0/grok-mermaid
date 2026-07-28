//! Golden-output harness: runs upstream mermaid.rs verbatim over a corpus.
//!
//! stdin: one case per line, `<width|none>\t<escaped source>`, where the source
//! escapes `\` as `\\`, newline as `\n` and carriage return as `\r`.
//! stdout: one case per line, `#NONE` or the escaped plain lines joined by `\n`.

mod mermaid;

use mermaid::MermaidStyles;
use ratatui::style::Style;
use std::io::Read;

fn unescape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars();
    while let Some(c) = chars.next() {
        if c != '\\' {
            out.push(c);
            continue;
        }
        match chars.next() {
            Some('n') => out.push('\n'),
            Some('r') => out.push('\r'),
            Some('t') => out.push('\t'),
            Some('\\') => out.push('\\'),
            Some(other) => out.push(other),
            None => out.push('\\'),
        }
    }
    out
}

fn escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            other => out.push(other),
        }
    }
    out
}

fn main() {
    let mut input = String::new();
    std::io::stdin().read_to_string(&mut input).unwrap();

    let s = Style::default();
    let styles = MermaidStyles {
        border: s,
        node_text: s,
        edge: s,
        edge_label: s,
        title: s,
    };

    let mut out = String::new();
    for line in input.lines() {
        if line.is_empty() {
            continue;
        }
        let (w, src) = line.split_once('\t').expect("malformed case");
        let width = if w == "none" {
            None
        } else {
            Some(w.parse::<usize>().unwrap())
        };
        let src = unescape(src);
        match mermaid::render(&src, &styles, width) {
            None => out.push_str("#NONE"),
            Some(art) => out.push_str(&escape(&art.plain_lines.join("\n"))),
        }
        out.push('\n');
    }
    print!("{out}");
}
