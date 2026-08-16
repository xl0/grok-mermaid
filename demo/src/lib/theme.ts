/**
 * The role theme model shared by the main page and the /render viewer: a
 * Role → ANSI-style mapping — lovely-mermaid's AnsiTheme made tangible, one
 * default per terminal scheme: dim border, bold title, plain labels; yellow
 * edges on dark, blue on light.
 */

import type { Role } from 'lovely-mermaid';

export type RoleKey = Exclude<Role, 'none'>;
export interface RoleStyle {
	bold: boolean;
	dim: boolean;
	/** ANSI 256-color indices, or null for the terminal defaults. */
	color: number | null;
	bg: number | null;
}
export type Slot = 'color' | 'bg';
export const ROLE_KEYS: RoleKey[] = ['border', 'text', 'edge', 'edgeLabel', 'title'];

export const defaultThemes: Record<'dark' | 'light', Record<RoleKey, RoleStyle>> = {
	dark: {
		border: { bold: false, dim: true, color: 14, bg: null },
		text: { bold: false, dim: false, color: null, bg: null },
		edge: { bold: false, dim: false, color: 12, bg: null },
		edgeLabel: { bold: false, dim: false, color: 11, bg: null },
		title: { bold: true, dim: false, color: null, bg: null }
	},
	light: {
		border: { bold: false, dim: false, color: 4, bg: null },
		text: { bold: false, dim: false, color: null, bg: null },
		edge: { bold: false, dim: false, color: 4, bg: null },
		edgeLabel: { bold: false, dim: false, color: 5, bg: null },
		title: { bold: true, dim: false, color: null, bg: null }
	}
};

export function sgrOf(s: RoleStyle): string | null {
	const p: string[] = [];
	if (s.bold) p.push('1');
	if (s.dim) p.push('2');
	if (s.color !== null) {
		if (s.color < 8) p.push(String(30 + s.color));
		else if (s.color < 16) p.push(String(90 + s.color - 8));
		else p.push(`38;5;${s.color}`);
	}
	if (s.bg !== null) {
		if (s.bg < 8) p.push(String(40 + s.bg));
		else if (s.bg < 16) p.push(String(100 + s.bg - 8));
		else p.push(`48;5;${s.bg}`);
	}
	return p.length ? p.join(';') : null;
}

// The 16-color ANSI palette: fed to AsciiArt as its Theme and used for the
// picker swatches, followed by the xterm 6x6x6 cube and grayscale ramp.
// prettier-ignore
export const BASE16 = [
	'#000000', '#cd3131', '#00a600', '#b58900', '#0451a5', '#bc05bc', '#0598bc', '#a5a5a5',
	'#666666', '#f14c4c', '#23d18b', '#f5f543', '#3b8eea', '#d670d6', '#29b8db', '#ffffff'
];
// Keep in sync with --term-bg/--term-fg in the layout styles: the component
// resolves colors at parse time, so dim must mix toward the actual panel
// background rather than a CSS var.
export const TERM = {
	dark: { bg: '#101014', fg: '#d4d4d4' },
	light: { bg: '#f6f8fa', fg: '#24292f' }
};

export function swatch(n: number): string {
	if (n < 16) return BASE16[n];
	const hex = (c: number) => c.toString(16).padStart(2, '0');
	if (n >= 232) return `#${hex(8 + 10 * (n - 232)).repeat(3)}`;
	const i = n - 16;
	const v = (c: number) => (c === 0 ? 0 : 55 + 40 * c);
	return `#${hex(v(Math.floor(i / 36)))}${hex(v(Math.floor(i / 6) % 6))}${hex(v(i % 6))}`;
}
