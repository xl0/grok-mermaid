<script lang="ts">
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { tick } from 'svelte';
	import { type AnsiTheme, diagramKind, type MermaidArt, render, sourceBox, toAnsi } from 'lovely-mermaid';
	import { AsciiArt } from 'svelte-asciiart';
	// Bundled verbatim, so the overlay can never drift from the repo copy.
	import skillMd from '../../../skills/lovely-mermaid/SKILL.md?raw';
	import { packHash, unpackHash } from '$lib/hash';
	import { presets } from '$lib/presets';
	import { BASE16, defaultThemes, ROLE_KEYS, sgrOf, TERM } from '$lib/theme';
	import ThemeEditor from '$lib/ThemeEditor.svelte';

	let src = $state(presets[0].src);
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
	}
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

	// Simulated streaming: replay the current source a few code points per
	// tick, the way an LLM would emit it — the live demo of render-per-prefix.
	// Clicking again stops and restores the full source; a manual edit or a
	// preset switch just stops (the user has taken over the text).
	let streaming = $state<ReturnType<typeof setInterval> | null>(null);
	let streamFull = '';
	function stopStream(restore = false) {
		if (streaming === null) return;
		clearInterval(streaming);
		streaming = null;
		if (restore) src = streamFull;
	}
	function stream() {
		if (streaming !== null) {
			stopStream(true);
			return;
		}
		streamFull = src;
		const cps = [...src];
		let at = 0;
		src = '';
		streaming = setInterval(() => {
			at = Math.min(at + 2, cps.length);
			src = cps.slice(0, at).join('');
			if (at >= cps.length) stopStream();
		}, 40);
	}

	// Presets differ in height, so switching reflows everything above the
	// commands. Pegging the viewport to the page bottom keeps the input and
	// the command grid (where the cursor is) exactly where they were.
	// The viewport widens to the smallest setting the preset's art fits —
	// a preset should always open showing art, not the source box.
	async function pick(p: { src: string }) {
		stopStream();
		const fromBottom = document.documentElement.scrollHeight - window.scrollY;
		src = p.src;
		const a = render(p.src);
		if (a !== null && a.width > cols) {
			cols = [30, 60, 120].find((w) => a.width <= w) ?? Infinity;
		}
		await tick();
		window.scrollTo({ top: document.documentElement.scrollHeight - fromBottom });
	}

	// The hash decodes async; hold the hash writer off until then so the
	// default source cannot clobber it.
	const hasHash = browser && location.hash.length > 1;
	let hashLoaded = $state(!hasHash);
	if (hasHash) {
		unpackHash(location.hash.slice(1))
			.then((s) => (src = s))
			.catch(() => {
				// junk hash from outside — keep the default
			})
			.finally(() => (hashLoaded = true));
	}

	// Writes are async too: apply only the latest, or a slow compression of an
	// old source could land after a newer one. `packed` also feeds the [view]
	// link to the /render/<data> viewer.
	let packed = $state('');
	let writeSeq = 0;
	$effect(() => {
		const s = src;
		if (!hashLoaded) return;
		const seq = ++writeSeq;
		if (s === '') {
			packed = '';
			history.replaceState(null, '', location.pathname);
			return;
		}
		packHash(s).then((h) => {
			if (seq !== writeSeq) return;
			packed = h;
			history.replaceState(null, '', `#${h}`);
		});
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
		art !== null && !fits
			? ([30, 60, 120, Infinity].find((w) => w > cols && art.width <= w) ?? null)
			: null
	);
	const shown: MermaidArt | null = $derived(
		src.trim() === ''
			? null
			: fits
				? art
				: sourceBox(src, cols === Infinity ? undefined : cols)
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
		art === null || !fits
			? cols === Infinity
				? 'sourceBox(src)'
				: `sourceBox(src, ${cols})`
			: 'render(src)'
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
	onkeydown={(e) => {
		if (e.key === 'Escape') skillOpen = false;
	}}
/>

<svelte:head>
	<title>lovely-mermaid — Mermaid diagrams as Unicode art</title>
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
		<ThemeEditor bind:theme onreset={() => setMode(dark)} />

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
			{#if shown}
				<span class="dim">{rendered.ms < 0.05 ? '<0.1' : rendered.ms.toFixed(1)} ms</span>
			{/if}
			<span class="spacer"></span>
			{#if packed !== ''}
				<a class="ghost" href="{base}/render/{packed}" target="_blank" rel="noopener">[view]</a>
			{/if}
			<button class="ghost" onclick={stream} disabled={src.trim() === '' && streaming === null}>
				[{streaming === null ? 'stream' : 'stop'}]
			</button>
			<span class="cols">
				<span class="dim">viewport</span>
				{#each [30, 60, 120, Infinity] as w (w)}
					<span class="vp"
						><button class="ghost" class:active={cols === w} onclick={() => (cols = w)}
							>[{w === Infinity ? '∞' : w}]</button
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
					cols={cols === Infinity ? shown.width : Math.max(cols, shown.width)}
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
			oninput={() => stopStream()}
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

	main {
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
		text-decoration: none;
	}
	.ghost:hover:enabled {
		color: var(--cmd);
	}
	a.ghost:hover {
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
