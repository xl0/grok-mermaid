import type { MermaidArt, Role } from './types.ts'

const ESC = String.fromCharCode(27)

/**
 * SGR parameter per role, e.g. `'2'` for dim, `'36'` for cyan,
 * `'38;5;244'` for a 256-colour index. A role left out is printed unstyled.
 */
export type AnsiTheme = Partial<Record<Role, string>>

/** Dim frame, plain labels, cyan connectors. Readable on light and dark. */
export const DEFAULT_THEME: AnsiTheme = {
  border: '2',
  edge: '36',
  edgeLabel: '2;36',
  title: '1',
}

/**
 * Render art to ANSI-coloured lines.
 *
 * A convenience over mapping `art.styled` yourself — reach for that directly
 * when your TUI has its own styling model.
 */
export function toAnsi(art: MermaidArt, theme: AnsiTheme = DEFAULT_THEME): string[] {
  return art.styled.map((row) =>
    row
      .map((span) => {
        const sgr = theme[span.role]
        return sgr === undefined ? span.text : `${ESC}[${sgr}m${span.text}${ESC}[0m`
      })
      .join(''),
  )
}
