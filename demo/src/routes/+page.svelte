<script lang="ts">
	import { browser } from '$app/environment';
	import { tick } from 'svelte';
	import { diagramKind, type MermaidArt, render, type Role, sourceBox } from 'lovely-mermaid';
	import { AsciiArt } from 'svelte-asciiart';
	// Bundled at build time: full box-drawing coverage (incl. ╭╮╰╯ arcs), so
	// no per-glyph fallback to a mismatched font can misalign the line art.
	import jbmRegular from 'jetbrains-mono/fonts/webfonts/JetBrainsMono-Regular.woff2';
	import jbmBold from 'jetbrains-mono/fonts/webfonts/JetBrainsMono-Bold.woff2';

	const presets: { name: string; desc: string; src: string }[] = [
		{
			name: 'flowchart',
			desc: 'nodes, branches, edge labels',
			src: `flowchart TD
  A[Parse source] --> B{Supported?}
  B -->|yes| C[Lay out]
  B -->|no| D[Framed source]
  C --> E[Unicode art]
  D --> E`
		},
		{
			name: 'shapes',
			desc: 'v2 @{shape, label} node syntax',
			src: `flowchart TD
  S@{shape: start, label: "Boot"} --> D@{shape: cyl, label: "Config DB"}
  D --> Q@{shape: diamond, label: "Valid?"}
  Q -->|yes| P@{shape: stadium, label: "Run app"}
  Q -->|no| E@{shape: dbl-circ, label: "Halt"}`
		},
		{
			name: 'subgraph',
			desc: 'nested titled frames',
			src: `flowchart TD
  In[Request] --> R
  subgraph svc [Service]
    R[Router] --> H1[Handler A]
    R --> H2[Handler B]
  end
  H1 --> Out[(Store)]
  H2 --> Out`
		},
		{
			name: 'sequence',
			desc: 'participants, messages, notes',
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
			name: 'activations',
			desc: 'hot lifelines between +/- marks',
			src: `sequenceDiagram
  Client->>+Server: request
  Server->>+DB: query
  DB-->>-Server: rows
  Server-->>-Client: response`
		},
		{
			name: 'state',
			desc: 'transitions, start/end markers',
			src: `stateDiagram-v2
  [*] --> Idle
  Idle --> Parsing: source arrives
  Parsing --> Drawing: parse ok
  Parsing --> Framed: parse fails
  Drawing --> [*]
  Framed --> [*]`
		},
		{
			name: 'composite',
			desc: 'nested states and -- regions',
			src: `stateDiagram-v2
  [*] --> Idle
  Idle --> Active
  state Active {
    [*] --> Fetching
    Fetching --> Rendering
    Rendering --> Fetching : retry
    --
    Log --> Flush
  }
  Active --> [*]`
		},
		{
			name: 'class',
			desc: 'compartments, members, relations',
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
  MermaidArt "1" --> "*" Span : rows of`
		},
		{
			name: 'er',
			desc: 'cardinalities at edge ends, aliases',
			src: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  c["Credit Card"] |o--|| CUSTOMER : pays with`
		},
		{
			name: 'cjk',
			desc: 'wide glyphs measured correctly',
			src: `flowchart LR
  A[你好世界] --> B[こんにちは]
  B --> C[🚀 Launch]
  C --> D[Done ✅]`
		},
		{
			name: 'broken',
			desc: 'lenient parsing, advisory warnings',
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

	// Presets differ in height, so switching reflows everything above the
	// commands. Pegging the viewport to the page bottom keeps the input and
	// the command grid (where the cursor is) exactly where they were.
	async function pick(p: { src: string }) {
		const fromBottom = document.documentElement.scrollHeight - window.scrollY;
		src = p.src;
		await tick();
		window.scrollTo({ top: document.documentElement.scrollHeight - fromBottom });
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

	const rendered = $derived.by(() => {
		const t0 = performance.now();
		const art = src.trim() === '' ? null : render(src);
		return { art, ms: performance.now() - t0 };
	});
	const art = $derived(rendered.art);
	const fits = $derived(art !== null && art.width <= cols);
	// When the art overflows the viewport, the smallest wider setting that
	// would fit — the button the overlay arrow points at.
	const fitTarget = $derived(
		art !== null && !fits ? ([30, 60, 120].find((w) => w > cols && art.width <= w) ?? null) : null
	);
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
	// The selected example's description, shown beside the call while active.
	const activeDesc = $derived(presets.find((p) => p.src === src)?.desc ?? null);

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

<svelte:window
	onclick={() => (paletteFor = null)}
	onkeydown={(e) => {
		if (e.key === 'Escape') paletteFor = null;
	}}
/>

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
		<div class="header-row">
			<span class="md-h"># lovely-mermaid</span>
			<span class="spacer"></span>
			<a href="https://github.com/xl0/lovely-mermaid">GitHub</a>
			<a href="https://www.npmjs.com/package/lovely-mermaid">npm</a>
		</div>
		<p>
			I render Mermaid diagrams as Unicode box-drawing art, for terminals.
		</p>
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
							onclick={(e) => {
								e.stopPropagation();
								paletteFor = paletteFor?.c === c && paletteFor.slot === slot ? null : { c, slot };
							}}
							>{theme[c][slot] === null ? '–' : ''}</button
						>
					{/each}
					{#if paletteFor?.c === c}
						{@const slot = paletteFor.slot}
						{@const pick = (n: number | null) => (theme[c][slot] = n)}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="palette" onclick={(e) => e.stopPropagation()} role="presentation">
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
			<button class="tb-copy" onclick={copyTheme} title="Copy the AnsiTheme literal"
				>{copiedTheme ? '[copied]' : '[copy]'}</button
			>
		</div>
	</div>

	<!-- tool turn: the call this page actually makes -->
	<div class="tool-block" data-state={toolState}>
		<div class="tool-title">
			<span class="dot">⏺</span>
			<code>{toolCall}</code>
			{#if activeDesc}<span class="dim">· {activeDesc}</span>{/if}
			{#if art}
				<span class="dim">art is {art.width} cols{fits ? '' : ` > ${cols}`}</span>
			{:else if shown}
				<span class="err">render(src) → null</span>
			{/if}
			<span class="spacer"></span>
			<span class="cols">
				<span class="dim">viewport</span>
				{#each [30, 60, 120] as w (w)}
					<span class="vp"
						><button class="ghost" class:active={cols === w} onclick={() => (cols = w)}>[{w}]</button
						>{#if fitTarget === w}<span class="fit-arrow">▲ fits</span>{/if}</span
					>
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
					cellAspect={0.6}
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

	<!-- the editor: the diagram source is the prompt -->
	<div class="editor-box">
		<span class="editor-title">Edit me</span>
		<span class="accent">❯</span>
		<textarea
			bind:value={src}
			rows={Math.max(2, src.split('\n').length)}
			wrap="off"
			spellcheck="false"
			aria-label="Mermaid source"
		></textarea>
	</div>

	<!-- not a real autocomplete, just dressed as one -->
	<div class="examples" role="listbox" aria-label="Example diagrams">
		{#each presets as p (p.name)}
			<button
				class="example"
				role="option"
				aria-selected={src === p.src}
				class:active={src === p.src}
				onclick={() => pick(p)}
			>/{p.name}</button
			>
		{/each}
	</div>

	<div class="statusline">
		<span class="accent">lovely-mermaid</span>
		<span>{diagramKind(src) ?? 'unknown'}</span>
		{#if shown}
			<span>{shown.width}×{shown.plain.length} cells</span>
		{/if}
		<span>{rendered.ms < 0.05 ? '<0.1' : rendered.ms.toFixed(1)} ms</span>
		<span class:warn={art !== null && art.warnings.length > 0}>
			⚠ {art?.warnings.length ?? 0}
		</span>
		<span class="spacer"></span>
		<span class="dim">100% text</span>
	</div>
</main>

<style>
	/* reserve the scrollbar gutter so pages shorter than the viewport don't
	   shift when the bar appears; the bar itself only shows when needed */
	:global(html) {
		scrollbar-gutter: stable;
	}
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

	.header-row {
		display: flex;
		align-items: baseline;
		gap: 1rem;
	}
	.vp {
		position: relative;
	}
	/* overlay nudge at the viewport button wide enough for the art */
	.fit-arrow {
		position: absolute;
		top: calc(100% + 0.15rem);
		left: 50%;
		/* centre the ▲ glyph itself on the button; the label trails right */
		transform: translateX(-0.5ch);
		color: #f0c674;
		white-space: nowrap;
		pointer-events: none;
		animation: nudge 1s ease-in-out infinite;
	}
	@keyframes nudge {
		50% {
			translate: 0 3px;
		}
	}
	.warn {
		color: #ffff00;
		opacity: 0.85;
	}
	.assistant .md-h {
		color: #f0c674;
		font-weight: bold;
	}
	.assistant p {
		margin: 0.4rem 0 0;
		max-width: 60rem;
	}

	/* the examples under the input, dressed as slash commands: an evenly
	   spaced grid of /names, left to right, top to bottom */
	.examples {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
		gap: 0.15rem 0.5rem;
		padding: 0 0.3rem;
	}
	.example {
		font: inherit;
		border: none;
		background: none;
		color: #00d7ff;
		text-align: left;
		cursor: pointer;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
	}
	.example:hover {
		background: #343541;
	}
	.example.active {
		background: #2a3a44;
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

	/* the rendered diagram mimics the user message: a padded block on Pi's
	   userMessageBg, sitting above the input. State lives in the ⏺ dot. */
	.tool-block {
		background: #343541;
		border-radius: 4px;
		padding: 0.6rem 0.8rem;
	}
	/* dim text has too little contrast on the grey message background */
	.tool-block .dim {
		color: #d4d4d4;
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
		/* the art sits on its own dark panel, like a terminal on the page */
		background: #101014;
		border-radius: 4px;
		padding: 0.4rem 0.6rem;
		width: fit-content;
		max-width: 100%;
		box-sizing: border-box;
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
		/* anchor for the palette overlay */
		position: relative;
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
	/* an overlay, so opening it never reflows the page */
	.palette {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		z-index: 20;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 0.45rem;
		background: #1c1826;
		border: 1px solid #505050;
		border-radius: 4px;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.55);
	}
	.prow {
		display: flex;
		gap: 2px;
	}

	.themecode {
		position: relative;
		display: inline-block;
		margin-top: 0.8rem;
	}
	.themecode pre {
		margin: 0;
		padding: 0.5rem 0.9rem;
		background: #101014;
		/* the same frame the rendered diagrams get */
		border: 1px solid #505050;
		border-radius: 4px;
		tab-size: 2;
		color: #b5bd68;
	}
	/* the copy control breaks the top border, styled like [reset] above */
	.tb-copy {
		position: absolute;
		top: -0.8em;
		right: 1rem;
		font: inherit;
		border: none;
		background: #101014;
		padding: 0 0.3em;
		color: #808080;
		cursor: pointer;
	}
	.tb-copy:hover {
		color: #00d7ff;
	}
	.tb-copy:hover {
		color: #00d7ff;
	}

	/* the editor, DynamicBorder-style: the prompt is the real input */
	.editor-box {
		border: 1px solid #5f87ff;
		border-radius: 6px;
		padding: 0.45rem 0.7rem;
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		position: relative;
	}
	/* a legend breaking the top border, DynamicBorder title style */
	.editor-title {
		position: absolute;
		top: -0.75em;
		right: 1rem;
		padding: 0 0.4em;
		background: #101014;
		color: #5f87ff;
		font-size: 0.8rem;
		user-select: none;
	}
	.editor-box textarea {
		flex: 1;
	}

	.statusline {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		color: #808080;
	}
</style>
