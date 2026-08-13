<script lang="ts">
	import { browser } from '$app/environment';
	import { type MermaidArt, render, type Role, sourceBox } from 'lovely-mermaid';
	import { AsciiArt } from 'svelte-asciiart';
	// Bundled at build time: full box-drawing coverage (incl. ╭╮╰╯ arcs), so
	// no per-glyph fallback to a mismatched font can misalign the line art.
	import jbmRegular from 'jetbrains-mono/fonts/webfonts/JetBrainsMono-Regular.woff2';
	import jbmBold from 'jetbrains-mono/fonts/webfonts/JetBrainsMono-Bold.woff2';

	const presets: { name: string; src: string }[] = [
		{
			name: 'flowchart',
			src: `flowchart TD
  A[Parse source] --> B{Supported?}
  B -->|yes| C[Lay out]
  B -->|no| D[Framed source]
  C --> E[Unicode art]
  D --> E`
		},
		{
			name: 'sequence',
			src: `sequenceDiagram
  participant U as User
  participant T as Terminal
  participant R as Renderer
  U->>T: mermaid source
  T->>R: render()
  R-->>T: unicode art
  T-->>U: pretty boxes`
		},
		{
			name: 'state',
			src: `stateDiagram-v2
  [*] --> Idle
  Idle --> Parsing: source arrives
  Parsing --> Drawing: parse ok
  Parsing --> Framed: parse fails
  Drawing --> [*]
  Framed --> [*]`
		},
		{
			name: 'class',
			src: `classDiagram
  class MermaidArt {
    +plain: string[]
    +styled: Span[][]
    +width: number
    +warnings: string[]
  }
  class Span {
    +text: string
    +role: Role
  }
  MermaidArt --> Span`
		},
		{
			name: 'er',
			src: `erDiagram
  DIAGRAM ||--|{ NODE : contains
  DIAGRAM ||--o{ EDGE : contains
  NODE }o--o{ EDGE : connects`
		},
		{
			name: 'cjk',
			src: `flowchart LR
  A[你好世界] --> B[こんにちは]
  B --> C[🚀 Launch]
  C --> D[Done ✅]`
		},
		{
			name: 'broken',
			src: `flowchart TD
  A[Start --> B
  C --> `
		}
	];

	// The theme is a Role → ANSI-style mapping — lovely-mermaid's AnsiTheme made
	// tangible. Defaults mirror the library's DEFAULT_THEME: dim border, cyan
	// edges, dim cyan edge labels, bold title.
	type RoleKey = Exclude<Role, 'none'>;
	interface RoleStyle {
		bold: boolean;
		dim: boolean;
		/** ANSI 256-color indices, or null for the terminal defaults. */
		color: number | null;
		bg: number | null;
	}
	type Slot = 'color' | 'bg';
	const ROLE_KEYS: RoleKey[] = ['border', 'text', 'edge', 'edgeLabel', 'title'];
	const defaultTheme: Record<RoleKey, RoleStyle> = {
		border: { bold: false, dim: true, color: null, bg: null },
		text: { bold: false, dim: false, color: null, bg: null },
		edge: { bold: false, dim: false, color: 6, bg: null },
		edgeLabel: { bold: false, dim: true, color: 6, bg: null },
		title: { bold: true, dim: false, color: null, bg: null }
	};
	function sgrOf(s: RoleStyle): string | null {
		const p: string[] = [];
		if (s.bold) p.push('1');
		if (s.dim) {
			// Dim as an opaque darkened truecolor, not SGR 2: svelte-asciiart
			// renders 2 as opacity, and box glyphs overshoot their cell (JBM's
			// │ by half a cell), so translucent rows double-composite into
			// striped lines. Terminals implement dim as a color change too.
			const base = s.color === null ? '#d4d4d4' : swatch(s.color);
			const [r, g, b] = [1, 3, 5].map((i) =>
				Math.round(parseInt(base.slice(i, i + 2), 16) * 0.55)
			);
			p.push(`38;2;${r};${g};${b}`);
		} else if (s.color !== null) {
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

	// Swatch colors for the picker: the component's default 16-color palette,
	// then the xterm 6x6x6 cube and grayscale ramp.
	// prettier-ignore
	const BASE16 = [
		'#000000', '#cd3131', '#00a600', '#b58900', '#0451a5', '#bc05bc', '#0598bc', '#a5a5a5',
		'#666666', '#f14c4c', '#23d18b', '#f5f543', '#3b8eea', '#d670d6', '#29b8db', '#ffffff'
	];
	function swatch(n: number): string {
		if (n < 16) return BASE16[n];
		const hex = (c: number) => c.toString(16).padStart(2, '0');
		if (n >= 232) return `#${hex(8 + 10 * (n - 232)).repeat(3)}`;
		const i = n - 16;
		const v = (c: number) => (c === 0 ? 0 : 55 + 40 * c);
		return `#${hex(v(Math.floor(i / 36)))}${hex(v(Math.floor(i / 6) % 6))}${hex(v(i % 6))}`;
	}

	let src = $state(initialSrc());
	let cols = $state(60);
	let theme = $state(structuredClone(defaultTheme));
	let paletteFor = $state<{ c: RoleKey; slot: Slot } | null>(null);
	let copied = $state(false);
	let copiedTheme = $state(false);

	// The current selections as an AnsiTheme literal, ready for toAnsi().
	const themeCode = $derived.by(() => {
		const entries = ROLE_KEYS.map((c) => [c, sgrOf(theme[c])] as const).filter(([, v]) => v !== null);
		if (entries.length === 0) return 'const theme: AnsiTheme = {};';
		const body = entries.map(([c, v]) => `\t${c}: '${v}',`).join('\n');
		return `const theme: AnsiTheme = {\n${body}\n};`;
	});

	async function copyTheme() {
		await navigator.clipboard.writeText(themeCode);
		copiedTheme = true;
		setTimeout(() => (copiedTheme = false), 1200);
	}

	function initialSrc(): string {
		if (browser && location.hash.length > 1) {
			try {
				return decodeURIComponent(location.hash.slice(1));
			} catch {
				// junk hash from outside — fall through to the default
			}
		}
		return presets[0].src;
	}

	$effect(() => {
		history.replaceState(null, '', src === '' ? location.pathname : `#${encodeURIComponent(src)}`);
	});

	const art = $derived(src.trim() === '' ? null : render(src));
	const fits = $derived(art !== null && art.width <= cols);
	const shown: MermaidArt | null = $derived(
		src.trim() === '' ? null : fits ? art : sourceBox(src, cols)
	);

	// Fixed pixels per cell (the component's cellSize prop). 15 rather than 16:
	// cell width is CELL × 0.6, and 9px lands glyphs on whole pixels — at 9.6px
	// every cell starts at a different subpixel phase and the antialiasing
	// stripes the line art.
	const CELL = 15;

	// The tool block reports the call the page actually made, Pi-style.
	const toolState = $derived(
		shown === null ? 'idle' : art === null ? 'error' : fits ? 'ok' : 'pending'
	);
	const toolCall = $derived(
		art === null || !fits ? `sourceBox(src, ${cols})` : 'render(src)'
	);

	// lovely-mermaid spans carry a role — the theme maps roles to ANSI SGR,
	// exactly what a terminal consumer does; the component parses it.
	const ESC = String.fromCharCode(27);
	const ansi = $derived(
		(shown?.styled ?? [])
			.map((row) =>
				row
					.map((s) => {
						const code = s.role === 'none' ? null : sgrOf(theme[s.role]);
						return code === null ? s.text : `${ESC}[${code}m${s.text}${ESC}[0m`;
					})
					.join('')
			)
			.join('\n')
	);

	async function copy() {
		if (!shown) return;
		await navigator.clipboard.writeText(shown.plain.join('\n'));
		copied = true;
		setTimeout(() => (copied = false), 1200);
	}
</script>

<svelte:head>
	<title>lovely-mermaid — Mermaid diagrams as Unicode art</title>
	{@html `<style>
		@font-face {
			font-family: 'JetBrains Mono';
			font-style: normal;
			font-weight: 400;
			src: url('${jbmRegular}') format('woff2');
		}
		@font-face {
			font-family: 'JetBrains Mono';
			font-style: normal;
			font-weight: 700;
			src: url('${jbmBold}') format('woff2');
		}
	</style>`}
	<meta
		name="description"
		content="Render Mermaid diagrams as Unicode box-drawing art for terminals. No browser, no SVG — a self-contained layout engine that emits text."
	/>
</svelte:head>

<main>
	<!-- assistant turn: the pitch -->
	<div class="assistant">
		<div class="md-h"># lovely-mermaid</div>
		<p>
			I render Mermaid diagrams as Unicode box-drawing art, for terminals. No headless browser, no
			SVG — a self-contained layout engine that emits text. Edit the message below, or pick a
			preset; I re-render on every keystroke.
		</p>
	</div>

	<!-- user turn: the diagram source is the message -->
	<div class="user-block">
		<div class="slash-row" role="toolbar" aria-label="Example diagrams">
			{#each presets as p}
				<button class="slash" class:active={src === p.src} onclick={() => (src = p.src)}
					>/{p.name}</button
				>
			{/each}
		</div>
		<textarea
			bind:value={src}
			rows={Math.max(4, src.split('\n').length)}
			wrap="off"
			spellcheck="false"
			aria-label="Mermaid source"
		></textarea>
	</div>

	<!-- tool turn: the call this page actually makes -->
	<div class="tool-block" data-state={toolState}>
		<div class="tool-title">
			<span class="dot">⏺</span>
			<code>{toolCall}</code>
			{#if art}
				<span class="dim">art is {art.width} cols{fits ? '' : ` > ${cols}`}</span>
			{:else if shown}
				<span class="err">render(src) → null</span>
			{/if}
			<span class="spacer"></span>
			<span class="cols">
				<span class="dim">viewport</span>
				{#each [30, 60, 120] as w (w)}
					<button class="ghost" class:active={cols === w} onclick={() => (cols = w)}>[{w}]</button>
				{/each}
			</span>
			<button class="ghost" onclick={copy} disabled={!shown}>{copied ? 'copied' : '[copy]'}</button>
		</div>

		{#if shown}
			<div class="art">
				<AsciiArt
					text={ansi}
					cols={Math.max(cols, shown.width)}
					frame
					margin={1}
					frameClass="term"
					cellSize={CELL}
					aria-label="Rendered diagram"
				/>
			</div>
		{:else}
			<div class="art empty">⏳ waiting for a diagram…</div>
		{/if}

		{#if art && art.warnings.length}
			<div class="tool-warnings">
				{#each art.warnings as w}<div>⚠ {w}</div>{/each}
			</div>
		{/if}
	</div>

	<!-- custom extension turn: the AnsiTheme editor -->
	<div class="custom-block">
		<div class="custom-label">theme</div>
		<p class="dim note">
			Spans carry roles, never colors — the consumer maps them to an
			<code>AnsiTheme</code>. Styling per role regenerates the SGR codes: the exact bytes a
			terminal would get. Defaults are the library's <code>DEFAULT_THEME</code>.
		</p>
		<div class="clsrows">
			{#each ROLE_KEYS as c (c)}
				<div class="clsrow">
					<span class="clsname">{c}</span>
					<button
						class="tog"
						class:active={theme[c].bold}
						onclick={() => (theme[c].bold = !theme[c].bold)}>bold</button
					>
					<button class="tog" class:active={theme[c].dim} onclick={() => (theme[c].dim = !theme[c].dim)}
						>dim</button
					>
					{#each ['color', 'bg'] as const as slot (slot)}
						<span class="slotname">{slot === 'color' ? 'fg' : 'bg'}</span>
						<button
							class="swatch"
							class:auto={theme[c][slot] === null}
							style={theme[c][slot] === null ? '' : `background:${swatch(theme[c][slot])}`}
							title={theme[c][slot] === null ? 'terminal default' : `ANSI color ${theme[c][slot]}`}
							onclick={() =>
								(paletteFor =
									paletteFor?.c === c && paletteFor.slot === slot ? null : { c, slot })}
							>{theme[c][slot] === null ? '–' : ''}</button
						>
					{/each}
					{#if paletteFor?.c === c}
						{@const slot = paletteFor.slot}
						{@const pick = (n: number | null) => (theme[c][slot] = n)}
						<div class="palette">
							<!-- the xterm-256 chart in its natural structure: 16 basics,
							     the 6x6x6 cube one red-level per row, the gray ramp -->
							{#each [[null, ...Array.from({ length: 16 }, (_, n) => n)], ...Array.from({ length: 6 }, (_, r) => Array.from({ length: 36 }, (_, i) => 16 + r * 36 + i)), Array.from({ length: 24 }, (_, i) => 232 + i)] as prow}
								<div class="prow">
									{#each prow as n (n)}
										{#if n === null}
											<button class="swatch auto" title="terminal default" onclick={() => pick(null)}
												>–</button
											>
										{:else}
											<button
												class="swatch"
												class:selected={theme[c][slot] === n}
												style="background:{swatch(n)}"
												title="ANSI color {n}"
												onclick={() => pick(n)}
												aria-label="ANSI color {n}"
											></button>
										{/if}
									{/each}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
			<button class="ghost" onclick={() => ((theme = structuredClone(defaultTheme)), (paletteFor = null))}
				>[reset]</button
			>
		</div>

		<div class="themecode">
			<pre>{themeCode}</pre>
			<button class="ghost" onclick={copyTheme}>{copiedTheme ? 'copied' : '[copy]'}</button>
		</div>
	</div>

	<!-- the idle editor -->
	<div class="editor-box">
		<span class="accent">❯</span>
		<span class="cursor"></span>
		<span class="dim hint">the real input is the message above — this one is just for looks</span>
	</div>

	<div class="statusline">
		<span>lovely-mermaid</span>
		<a href="https://github.com/xl0/lovely-mermaid">GitHub</a>
		<a href="https://www.npmjs.com/package/lovely-mermaid">npm</a>
		<span class="spacer"></span>
		<span class="dim">100% text · no browser required · width is the caller's decision</span>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #101014;
		color: #d4d4d4;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 0.85rem;
		line-height: 1.45;
		--ascii-font-family: 'JetBrains Mono', ui-monospace, monospace;
	}

	main {
		max-width: 72rem;
		margin: 0 auto;
		padding: 1.2rem 1rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.dim {
		color: #666666;
	}
	.accent {
		color: #8abeb7;
	}
	.err {
		color: #cc6666;
	}
	.spacer {
		flex: 1;
	}
	code {
		color: #8abeb7;
	}
	a {
		color: #81a2be;
	}

	.assistant .md-h {
		color: #f0c674;
		font-weight: bold;
	}
	.assistant p {
		margin: 0.4rem 0 0;
		max-width: 60rem;
	}

	/* user message: padded block on Pi's userMessageBg */
	.user-block {
		background: #343541;
		border-radius: 4px;
		padding: 0.6rem 0.8rem;
	}
	.slash-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 0.7rem;
		margin-bottom: 0.5rem;
	}
	.slash {
		font: inherit;
		border: none;
		background: none;
		color: #808080;
		cursor: pointer;
		padding: 0;
	}
	.slash:hover {
		color: #00d7ff;
	}
	.slash.active {
		color: #8abeb7;
	}
	textarea {
		width: 100%;
		/* sized by rows= to the content — no vertical scroll, ever */
		resize: none;
		overflow-y: hidden;
		box-sizing: border-box;
		font: inherit;
		/* `-->` must read as what you type, not the ⟶ ligature */
		font-variant-ligatures: none;
		line-height: 1.35;
		padding: 0;
		border: none;
		outline: none;
		background: transparent;
		color: #d4d4d4;
	}

	/* tool execution: no background — the art is the content. State lives in
	   the ⏺ dot instead. */
	.tool-block {
		padding: 0.2rem 0.8rem;
	}
	.tool-block .dot {
		color: #666666;
	}
	.tool-block[data-state='ok'] .dot {
		color: #b5bd68;
	}
	.tool-block[data-state='pending'] .dot {
		color: #f0c674;
	}
	.tool-block[data-state='error'] .dot {
		color: #cc6666;
	}
	.tool-title {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}
	.tool-title code {
		color: #d4d4d4;
	}
	.cols {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		white-space: nowrap;
	}
	.ghost.active {
		color: #8abeb7;
	}
	.ghost {
		font: inherit;
		border: none;
		background: none;
		color: #808080;
		cursor: pointer;
		padding: 0;
	}
	.ghost:hover:enabled {
		color: #00d7ff;
	}
	.ghost:disabled {
		color: #505050;
		cursor: default;
	}

	.art {
		overflow-x: auto;
		overflow-y: hidden;
	}
	/* inline svg baseline gap would add phantom height inside the scroller */
	.art :global(svg) {
		display: block;
	}
	.art.empty {
		color: #666666;
		padding: 0.4rem 0;
	}
	.art :global(rect.term) {
		stroke: #505050;
		stroke-width: 0.05;
	}

	.tool-warnings {
		margin-top: 0.4rem;
		color: #ffff00;
		opacity: 0.75;
	}

	/* custom extension message, with Pi's purple label */
	.custom-block {
		background: #2d2838;
		border-radius: 4px;
		padding: 0.6rem 0.8rem;
	}
	.custom-label {
		color: #9575cd;
		font-weight: bold;
	}
	.note {
		margin: 0.3rem 0 0.6rem;
		max-width: 60rem;
	}

	.clsrows {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		align-items: flex-start;
	}
	.clsrow {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.clsname {
		width: 6.5rem;
		color: #d4d4d4;
	}
	.slotname {
		color: #666666;
		font-size: 0.75rem;
	}
	.tog {
		font: inherit;
		font-size: 0.75rem;
		border: none;
		background: none;
		color: #666666;
		cursor: pointer;
		padding: 0;
	}
	.tog.active {
		color: #b5bd68;
	}
	.tog::before {
		content: '[';
		color: #505050;
	}
	.tog::after {
		content: ']';
		color: #505050;
	}
	.swatch {
		width: 1.05rem;
		height: 1.05rem;
		padding: 0;
		border: 1px solid #505050;
		border-radius: 2px;
		font-size: 0.7rem;
		line-height: 1;
		cursor: pointer;
	}
	.swatch.auto {
		background: transparent;
		color: #808080;
	}
	.swatch.selected {
		outline: 2px solid #00d7ff;
	}
	.palette {
		flex-basis: 100%;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 0.3rem 0 0.2rem;
	}
	.prow {
		display: flex;
		gap: 2px;
	}

	.themecode {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.4rem;
		margin-top: 0.8rem;
	}
	.themecode pre {
		margin: 0;
		padding: 0.5rem 0.7rem;
		background: #101014;
		border-radius: 4px;
		tab-size: 2;
		color: #b5bd68;
	}

	/* the idle editor at the bottom, DynamicBorder-style */
	.editor-box {
		border: 1px solid #5f87ff;
		border-radius: 6px;
		padding: 0.45rem 0.7rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.cursor {
		display: inline-block;
		width: 0.55em;
		height: 1.1em;
		background: #d4d4d4;
		animation: blink 1.1s steps(1) infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
	.hint {
		user-select: none;
	}

	.statusline {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		color: #808080;
	}
</style>
