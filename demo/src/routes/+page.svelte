<script lang="ts">
	import { browser } from '$app/environment';
	import { tick } from 'svelte';
	import {
		type AnsiTheme,
		diagramKind,
		type MermaidArt,
		render,
		type Role,
		sourceBox,
		toAnsi
	} from 'lovely-mermaid';
	import { AsciiArt } from 'svelte-asciiart';
	// Bundled at build time: full box-drawing coverage (incl. ╭╮╰╯ arcs), so
	// no per-glyph fallback to a mismatched font can misalign the line art.
	import jbmRegular from 'jetbrains-mono/fonts/webfonts/JetBrainsMono-Regular.woff2';
	import jbmBold from 'jetbrains-mono/fonts/webfonts/JetBrainsMono-Bold.woff2';
	// Bundled verbatim, so the overlay can never drift from the repo copy.
	import skillMd from '../../../skills/lovely-mermaid/SKILL.md?raw';

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
			name: 'title',
			desc: 'frontmatter title over the art',
			src: `---
title: Deploy pipeline
---
flowchart LR
  Build --> Test
  Test --> Ship
  Ship --> Done`
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
			name: 'cycles',
			desc: 'back and skip edges route around',
			src: `flowchart TD
  A[Fetch] --> B{OK?}
  B -->|yes| C[Parse]
  B -->|no| R[Backoff]
  R --> A
  C --> D[Render]
  A -.->|cache hit| D`
		},
		{
			name: 'pipeline',
			desc: 'retry loops at several depths',
			src: `flowchart TD
  push[Git push] --> ci{CI green?}
  ci -->|yes| build[Build image]
  ci -->|no| notify[Notify author]
  build --> stage[Deploy staging]
  stage --> smoke{Smoke tests}
  smoke -->|flaky| stage
  smoke -->|pass| prod[Deploy prod]
  smoke -->|fail| notify
  prod --> monitor[Monitor SLOs]
  monitor -->|regression| roll[Rollback]
  roll --> stage
  notify --> push`
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
			name: 'styles',
			desc: 'classDef colors, best-effort applied',
			src: `flowchart TD
  A[Request]:::hot --> B{Authorized?}
  B -->|yes| C[Serve]:::ok
  B -->|no| D[401 Denied]:::err
  C --> E[(Cache)]
  class E cold
  classDef hot fill:#ff9966,color:#000000
  classDef ok stroke:#22a06b,color:#22a06b
  classDef err fill:#8b0000,color:#ffdddd
  classDef cold fill:lightblue,color:#000000,font-weight:bold`
		},
		{
			name: 'state-styles',
			desc: ':::class + classDef in state diagrams',
			src: `stateDiagram-v2
  [*] --> Healthy
  Healthy --> Degraded : probe fails
  Degraded --> Healthy : recovers
  Degraded --> Down:::alert : timeout
  Down --> [*]
  class Healthy ok
  classDef ok stroke:#22a06b,color:#22a06b
  classDef alert fill:#8b0000,color:#ffdddd,font-weight:bold`
		},
		{
			name: 'links',
			desc: 'click/link → OSC 8 hyperlinks',
			src: `flowchart TD
  A[README] --> B{Where?}
  B -->|terminal| C[npm]
  B -->|browser| D[GitHub]
  click C "https://www.npmjs.com/package/lovely-mermaid"
  click D "https://github.com/xl0/lovely-mermaid"`
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
			name: 'mindmap',
			desc: 'indentation tree with TUI guides',
			src: `mindmap
  root((lovely-mermaid))
    Parsing
      Lenient
      Streaming
    Layout
      Sugiyama
      Lanes
    Output
      Roles
      Classes`
		},
		{
			name: 'timeline',
			desc: 'periods and events, sections',
			src: `timeline
  title Project history
  section Port
  2026-07 : Byte-faithful port : Differential harness
  section Redesign
  2026-08 : Lenient parsing : Semantic spans
          : New diagram types`
		},
		{
			name: 'pie',
			desc: 'proportions as a bar list',
			src: `pie showData title Render targets
  "Terminals" : 62
  "TUIs" : 25
  "CI logs" : 13`
		},
		{
			name: 'gitgraph',
			desc: 'commit lanes, git log --graph style',
			src: `gitGraph
  commit id: "scaffold"
  branch feature
  commit id: "parse"
  checkout main
  commit id: "docs"
  merge feature tag: "v1.0"
  commit id: "polish"`
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
	// tangible, one default per terminal scheme: dim border, bold title, plain
	// labels; yellow edges on dark, blue on light.
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
	const defaultThemes: Record<'dark' | 'light', Record<RoleKey, RoleStyle>> = {
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
	function sgrOf(s: RoleStyle): string | null {
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
	const BASE16 = [
		'#000000', '#cd3131', '#00a600', '#b58900', '#0451a5', '#bc05bc', '#0598bc', '#a5a5a5',
		'#666666', '#f14c4c', '#23d18b', '#f5f543', '#3b8eea', '#d670d6', '#29b8db', '#ffffff'
	];
	// Keep in sync with --term-bg/--term-fg in the styles below: the component
	// resolves colors at parse time now, so dim must mix toward the actual
	// panel background rather than a CSS var.
	const TERM = {
		dark: { bg: '#101014', fg: '#d4d4d4' },
		light: { bg: '#f6f8fa', fg: '#24292f' }
	};
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
	// Page theme (CSS vars on body, overridden by body.light). The terminal
	// panel follows it, so switching also loads the matching role theme.
	let dark = $state(true);
	$effect(() => {
		document.body.classList.toggle('light', !dark);
	});
	let theme = $state(structuredClone(defaultThemes.dark));
	function setMode(d: boolean) {
		dark = d;
		theme = structuredClone(defaultThemes[d ? 'dark' : 'light']);
		paletteFor = null;
	}
	let paletteFor = $state<{ c: RoleKey; slot: Slot } | null>(null);
	let copied = $state(false);
	let copiedTheme = $state(false);

	// The current selections as an AnsiTheme, plus the same as a literal
	// for copy-paste.
	const themeEntries = $derived(
		ROLE_KEYS.map((c) => [c, sgrOf(theme[c])] as const).filter(([, v]) => v !== null)
	);
	const ansiTheme = $derived(Object.fromEntries(themeEntries) as AnsiTheme);
	// The component-side theme: palette plus the terminal panel's actual colors.
	const asciiTheme = $derived({
		palette: BASE16,
		foreground: TERM[dark ? 'dark' : 'light'].fg,
		background: TERM[dark ? 'dark' : 'light'].bg
	});
	const themeCode = $derived.by(() => {
		if (themeEntries.length === 0) return 'const theme: AnsiTheme = {};';
		const body = themeEntries.map(([c, v]) => `\t${c}: '${v}',`).join('\n');
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

	// The source rides in the hash as base64url of its UTF-8 bytes — far more
	// compact than percent-encoding, where every space and newline is 3 chars.
	const b64 = (s: string) =>
		btoa(String.fromCharCode(...new TextEncoder().encode(s)))
			.replaceAll('+', '-')
			.replaceAll('/', '_')
			.replace(/=+$/, '');
	function unB64(h: string): string {
		const bin = atob(h.replaceAll('-', '+').replaceAll('_', '/'));
		return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
	}

	function initialSrc(): string {
		if (browser && location.hash.length > 1) {
			try {
				return unB64(location.hash.slice(1));
			} catch {
				// junk hash from outside — fall through to the default
			}
		}
		return presets[0].src;
	}

	$effect(() => {
		history.replaceState(null, '', src === '' ? location.pathname : `#${b64(src)}`);
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

	// The library's own ANSI path with the picked theme — exactly what a
	// terminal consumer gets, author classes (:::name + classDef) included;
	// the component parses the SGR back.
	const ansi = $derived(shown === null ? '' : toAnsi(shown, ansiTheme).join('\n'));

	async function copy() {
		if (!shown) return;
		await navigator.clipboard.writeText(shown.plain.join('\n'));
		copied = true;
		setTimeout(() => (copied = false), 1200);
	}

	// The agent skill, shown in an overlay and copyable as a file.
	let skillOpen = $state(false);
	let copiedSkill = $state(false);
	// The page must not scroll behind the open overlay. The scroller is the
	// root element, not body, so the lock goes there.
	$effect(() => {
		document.documentElement.style.overflow = skillOpen ? 'hidden' : '';
	});
	async function copySkill() {
		await navigator.clipboard.writeText(skillMd);
		copiedSkill = true;
		setTimeout(() => (copiedSkill = false), 1200);
	}
</script>

<svelte:window
	onclick={() => (paletteFor = null)}
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			paletteFor = null;
			skillOpen = false;
		}
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
			<button class="ghost" onclick={() => setMode(!dark)}>[{dark ? 'light' : 'dark'}]</button>
			<button class="ghost" onclick={(e) => { e.stopPropagation(); skillOpen = true; }}>skill</button>
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
			<button class="ghost" onclick={() => setMode(dark)}>[reset]</button>
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
					theme={asciiTheme}
					cols={Math.max(cols, shown.width)}
					margin={1}
					cellSize={CELL}
					style="width: auto; height: auto;"
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

{#if skillOpen}
	<!-- Escape is handled on svelte:window; clicking the backdrop (and only
	     the backdrop) closes, so the box itself needs no click handler. -->
	<div
		class="overlay"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) skillOpen = false;
		}}
	>
		<div
			class="skill-box"
			role="dialog"
			aria-modal="true"
			aria-label="The lovely-mermaid agent skill"
		>
			<div class="skill-title">
				<a href="https://github.com/xl0/lovely-mermaid/blob/master/skills/lovely-mermaid/SKILL.md">
					skills/lovely-mermaid/SKILL.md
				</a>
				<span class="spacer"></span>
				<button class="ghost" onclick={copySkill}>{copiedSkill ? 'copied' : '[copy]'}</button>
				<button class="ghost" onclick={() => (skillOpen = false)}>[esc]</button>
			</div>
			<pre>{skillMd}</pre>
		</div>
	</div>
{/if}

<style>
	/* reserve the scrollbar gutter so pages shorter than the viewport don't
	   shift when the bar appears; the bar itself only shows when needed */
	:global(html) {
		scrollbar-gutter: stable;
	}
	/* the page palette; body.light re-skins everything, terminal panel
	   (--term-bg/--term-fg) included */
	:global(body) {
		--term-bg: #101014;
		--term-fg: #d4d4d4;
		--bg: #101014;
		--fg: #d4d4d4;
		--dim: #666666;
		--accent: #8abeb7;
		--err: #cc6666;
		--link: #81a2be;
		--gold: #f0c674;
		--warnc: #ffff00;
		--cmd: #00d7ff;
		--msg-bg: #343541;
		--msg-fg: #d4d4d4;
		--active-bg: #2a3a44;
		--ok: #b5bd68;
		--ghost: #808080;
		--muted: #505050;
		--custom-bg: #2d2838;
		--purple: #9575cd;
		--palette-bg: #1c1826;
		--shadow: rgba(0, 0, 0, 0.55);
		margin: 0;
		background: var(--bg);
		color: var(--fg);
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 0.85rem;
		line-height: 1.45;
		--ascii-font-family: 'JetBrains Mono', ui-monospace, monospace;
	}
	:global(body.light) {
		--term-bg: #f6f8fa;
		--term-fg: #24292f;
		--bg: #ffffff;
		--fg: #2b2b2b;
		--dim: #767676;
		--accent: #2f7a6e;
		--err: #b3413e;
		--link: #3567a8;
		--gold: #9a6700;
		--warnc: #9a6700;
		--cmd: #0087af;
		--msg-bg: #ececf1;
		--msg-fg: #3f3f46;
		--active-bg: #cfe3ec;
		--ok: #4f7d21;
		--ghost: #6e6e6e;
		--muted: #c0c0c0;
		--custom-bg: #efe9f7;
		--purple: #6a4fa3;
		--palette-bg: #f6f3fb;
		--shadow: rgba(0, 0, 0, 0.2);
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
		color: var(--dim);
	}
	.accent {
		color: var(--accent);
	}
	.err {
		color: var(--err);
	}
	.spacer {
		flex: 1;
	}
	code {
		color: var(--accent);
	}
	a {
		color: var(--link);
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
		color: var(--gold);
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
		color: var(--warnc);
		opacity: 0.85;
	}
	.assistant .md-h {
		color: var(--gold);
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
		color: var(--cmd);
		text-align: left;
		cursor: pointer;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
	}
	.example:hover {
		background: var(--msg-bg);
	}
	.example.active {
		background: var(--active-bg);
		color: var(--accent);
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
		color: var(--fg);
	}

	/* the rendered diagram mimics the user message: a padded block on Pi's
	   userMessageBg, sitting above the input. State lives in the ⏺ dot. */
	.tool-block {
		background: var(--msg-bg);
		border-radius: 4px;
		padding: 0.6rem 0.8rem;
	}
	/* dim text has too little contrast on the grey message background */
	.tool-block .dim {
		color: var(--msg-fg);
	}
	.tool-block .dot {
		color: var(--dim);
	}
	.tool-block[data-state='ok'] .dot {
		color: var(--ok);
	}
	.tool-block[data-state='pending'] .dot {
		color: var(--gold);
	}
	.tool-block[data-state='error'] .dot {
		color: var(--err);
	}
	.tool-title {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}
	.tool-title code {
		color: var(--msg-fg);
	}
	.cols {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		white-space: nowrap;
	}
	.ghost.active {
		color: var(--accent);
	}
	.ghost {
		font: inherit;
		border: none;
		background: none;
		color: var(--ghost);
		cursor: pointer;
		padding: 0;
	}
	.ghost:hover:enabled {
		color: var(--cmd);
	}
	.ghost:disabled {
		color: var(--muted);
		cursor: default;
	}

	.art {
		overflow-x: auto;
		overflow-y: hidden;
		/* the art sits on its own panel, like a terminal on the page; the
		   matching fg/bg go to AsciiArt via the theme prop (TERM above) */
		background: var(--term-bg);
		color: var(--term-fg);
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
	/* Unstyled runs fill with currentColor, and the UA link colors (worst:
	   :visited's dark purple) would leak in through the OSC 8 <a> wrappers. */
	.art :global(svg a) {
		color: inherit;
	}
	.art.empty {
		color: var(--dim);
		padding: 0.4rem 0;
	}
	.art :global(rect.term) {
		stroke: var(--muted);
		stroke-width: 0.05;
	}

	.tool-warnings {
		margin-top: 0.4rem;
		color: var(--warnc);
		opacity: 0.75;
	}

	/* custom extension message, with Pi's purple label */
	.custom-block {
		background: var(--custom-bg);
		border-radius: 4px;
		padding: 0.6rem 0.8rem;
	}
	.custom-label {
		color: var(--purple);
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
		color: var(--fg);
	}
	.slotname {
		color: var(--dim);
		font-size: 0.75rem;
	}
	.tog {
		font: inherit;
		font-size: 0.75rem;
		border: none;
		background: none;
		color: var(--dim);
		cursor: pointer;
		padding: 0;
	}
	.tog.active {
		color: var(--ok);
	}
	.tog::before {
		content: '[';
		color: var(--muted);
	}
	.tog::after {
		content: ']';
		color: var(--muted);
	}
	.swatch {
		width: 1.05rem;
		height: 1.05rem;
		padding: 0;
		border: 1px solid var(--muted);
		border-radius: 2px;
		font-size: 0.7rem;
		line-height: 1;
		cursor: pointer;
	}
	.swatch.auto {
		background: transparent;
		color: var(--ghost);
	}
	.swatch.selected {
		outline: 2px solid var(--cmd);
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
		background: var(--palette-bg);
		border: 1px solid var(--muted);
		border-radius: 4px;
		box-shadow: 0 6px 20px var(--shadow);
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
	/* the SGR literal renders like terminal output, on the terminal panel */
	.themecode pre {
		margin: 0;
		padding: 0.5rem 0.9rem;
		background: var(--term-bg);
		/* the same frame the rendered diagrams get */
		border: 1px solid var(--muted);
		border-radius: 4px;
		tab-size: 2;
		color: var(--ok);
	}
	/* the copy control breaks the top border, styled like [reset] above */
	.tb-copy {
		position: absolute;
		top: -0.8em;
		right: 1rem;
		font: inherit;
		border: none;
		background: var(--term-bg);
		padding: 0 0.3em;
		color: var(--ghost);
		cursor: pointer;
	}
	.tb-copy:hover {
		color: var(--cmd);
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
		background: var(--bg);
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
		color: var(--ghost);
	}

	/* The skill overlay: a framed file view over a dimmed page. */
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		z-index: 10;
	}
	.skill-box {
		background: var(--bg);
		border: 1px solid var(--panel-border, var(--ghost));
		border-radius: 4px;
		max-width: 46rem;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
	}
	.skill-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		border-bottom: 1px solid var(--panel-border, var(--ghost));
		color: #5f87ff;
	}
	.skill-title a {
		color: inherit;
	}
	.skill-box pre {
		margin: 0;
		padding: 0.75rem 1rem;
		overflow: auto;
		font-size: 0.85rem;
		line-height: 1.45;
		white-space: pre-wrap;
	}
</style>
