<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { type AnsiTheme, render, toAnsi } from 'lovely-mermaid';
	import { AsciiArt } from 'svelte-asciiart';
	import AnsiCanvas from '$lib/AnsiCanvas.svelte';
	import { packHash, unpackHash } from '$lib/hash';
	import { BASE16, defaultThemes, ROLE_KEYS, sgrOf, TERM } from '$lib/theme';
	import ThemeEditor from '$lib/ThemeEditor.svelte';

	// A bare /render opens empty with the editor up — a scratchpad; with data
	// it is a viewer. Raw replaceState below never updates page.params, so
	// the decode runs once.
	let src = $state<string | null>(page.params.data ? null : '');
	let failed = $state(false);
	let editOpen = $state(!page.params.data);
	$effect(() => {
		const d = page.params.data;
		if (!d) return;
		unpackHash(d)
			.then((s) => (src = s))
			.catch(() => (failed = true));
	});

	// The editor drawer edits `src` in place; the URL follows, so the link in
	// the address bar always names what is on screen. Async writes apply only
	// the latest.
	let writeSeq = 0;
	$effect(() => {
		const s = src;
		if (s === null) return;
		const seq = ++writeSeq;
		if (s.trim() === '') {
			writeSeq++;
			history.replaceState(null, '', `${base}/render`);
			return;
		}
		packHash(s).then((h) => {
			if (seq === writeSeq) history.replaceState(null, '', `${base}/render/${h}`);
		});
	});

	let dark = $state(true);
	$effect(() => {
		document.body.classList.toggle('light', !dark);
	});
	let theme = $state(structuredClone(defaultThemes.dark));
	function setMode(d: boolean) {
		dark = d;
		theme = structuredClone(defaultThemes[d ? 'dark' : 'light']);
	}
	let menuOpen = $state(false);

	const ansiTheme = $derived(
		Object.fromEntries(
			ROLE_KEYS.map((c) => [c, sgrOf(theme[c])] as const).filter(([, v]) => v !== null)
		) as AnsiTheme
	);
	const asciiTheme = $derived({
		palette: BASE16,
		foreground: TERM[dark ? 'dark' : 'light'].fg,
		background: TERM[dark ? 'dark' : 'light'].bg
	});

	const art = $derived(src === null ? null : render(src));
	const ansi = $derived(art === null ? '' : toAnsi(art, ansiTheme).join('\n'));

	// Same fixed pixels per cell as the main page: 9px cells land glyphs on
	// whole pixels at scale 1.
	const CELL = 15;

	// The view transform: art pixels -> screen is translate(tx,ty) scale(s).
	let s = $state(1);
	let tx = $state(0);
	let ty = $state(0);
	let vpW = $state(0);
	let vpH = $state(0);
	// The canvas renderer shares the art's cell geometry, so the art's pixel
	// size is arithmetic, not a DOM measurement (margin of 1 cell each side).
	const artW = $derived(art === null ? 0 : (art.width + 2) * CELL * 0.6);
	const artH = $derived(art === null ? 0 : (art.plain.length + 2) * CELL);
	let fitted = false;
	$effect(() => {
		if (!fitted && artW > 0 && vpW > 0) {
			fitted = true;
			fit();
		}
	});

	const clampS = (v: number): number => Math.min(8, Math.max(0.05, v));
	function fit() {
		if (artW === 0 || vpW === 0) return;
		s = clampS(Math.min(vpW / artW, vpH / artH) * 0.95);
		center();
	}
	function center() {
		tx = (vpW - artW * s) / 2;
		ty = (vpH - artH * s) / 2;
	}
	function zoomAt(px: number, py: number, factor: number) {
		const next = clampS(s * factor);
		tx = px - ((px - tx) * next) / s;
		ty = py - ((py - ty) * next) / s;
		s = next;
	}
	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
	}

	let copied = $state(false);
	async function copy() {
		if (art === null) return;
		await navigator.clipboard.writeText(art.plain.join('\n'));
		copied = true;
		setTimeout(() => (copied = false), 1200);
	}

	let dragging = $state(false);
	function onDown(e: PointerEvent) {
		// No default: dragging must pan, never start a text selection.
		e.preventDefault();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		dragging = true;
	}
	// Pointermove fires faster than the frame rate; accumulate and apply once
	// per animation frame so a pan costs one style write per frame.
	let pendX = 0;
	let pendY = 0;
	let pendRaf = 0;
	function onMove(e: PointerEvent) {
		if (!dragging) return;
		pendX += e.movementX;
		pendY += e.movementY;
		if (pendRaf === 0) {
			pendRaf = requestAnimationFrame(() => {
				tx += pendX;
				ty += pendY;
				pendX = pendY = 0;
				pendRaf = 0;
			});
		}
	}

	// The minimap: the same art scaled to a corner thumbnail, with the visible
	// region outlined; click or drag centres the view there.
	// Sized to the viewport, not a fixed pixel cap: a fifth of the width and
	// under a third of the height, so it reads on large screens too.
	const k = $derived(
		artW === 0 ? 1 : Math.min(Math.min(vpW * 0.2, 560) / artW, (vpH * 0.3) / artH)
	);
	const miniRect = $derived({
		x: (-tx / s) * k,
		y: (-ty / s) * k,
		w: (vpW / s) * k,
		h: (vpH / s) * k
	});
	// The minimap earns its corner only when some of the diagram is off
	// screen; fully visible art needs no locator.
	const miniVisible = $derived(
		artW > 0 && !(tx >= -2 && ty >= -2 && tx + artW * s <= vpW + 2 && ty + artH * s <= vpH + 2)
	);
	let miniDrag = $state(false);
	function miniTo(e: PointerEvent) {
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		tx = vpW / 2 - ((e.clientX - r.left) / k) * s;
		ty = vpH / 2 - ((e.clientY - r.top) / k) * s;
	}
</script>

<svelte:head>
	<title>lovely-mermaid — diagram</title>
</svelte:head>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			menuOpen = false;
			editOpen = false;
		}
	}}
/>

<div class="viewer">
	<div class="bar">
		<span class="accent">lovely-mermaid</span>
		{#if art}
			<span class="dim">{art.width}×{art.plain.length} cells</span>
			<span class="dim">{Math.round(s * 100)}%</span>
		{/if}
		<span class="spacer"></span>
		<button class="ghost" onclick={fit}>[fit]</button>
		<button
			class="ghost"
			onclick={() => {
				s = 1;
				center();
			}}>[1:1]</button
		>
		<button class="ghost" onclick={() => zoomAt(vpW / 2, vpH / 2, 1.25)}>[+]</button>
		<button class="ghost" onclick={() => zoomAt(vpW / 2, vpH / 2, 0.8)}>[−]</button>
		<button class="ghost" class:active={menuOpen} onclick={() => (menuOpen = !menuOpen)}
			>[theme]</button
		>
		<button class="ghost" onclick={() => setMode(!dark)}>[{dark ? 'light' : 'dark'}]</button>
		<button class="ghost" onclick={copy} disabled={art === null}>
			{copied ? 'copied' : '[copy]'}
		</button>
		<button class="ghost" class:active={editOpen} onclick={() => (editOpen = !editOpen)}>
			[edit]
		</button>
	</div>

	<div
		class="stage"
		class:dragging
		role="application"
		aria-label="Diagram viewport: drag to pan, scroll to zoom"
		bind:clientWidth={vpW}
		bind:clientHeight={vpH}
		onwheel={onWheel}
		onpointerdown={onDown}
		onpointermove={onMove}
		onpointerup={() => (dragging = false)}
		onpointercancel={() => (dragging = false)}
	>
		{#if failed}
			<div class="note err">This link does not decode to a diagram.</div>
		{:else if src === null}
			<div class="note dim">decoding…</div>
		{:else if src.trim() === ''}
			<div class="note dim">⏳ waiting for a diagram — type below</div>
		{:else if art === null}
			<div class="note err">render(src) → null — nothing to draw for this source.</div>
		{:else}
			<AnsiCanvas {art} {theme} {dark} cell={CELL} {s} {tx} {ty} />
		{/if}

		{#if art && artW > 0}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="minimap"
				class:off={!miniVisible}
				style="width: {artW * k}px; height: {artH * k}px"
				onpointerdown={(e) => {
					e.preventDefault();
					e.stopPropagation();
					(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
					miniDrag = true;
					miniTo(e);
				}}
				onpointermove={(e) => {
					if (miniDrag) miniTo(e);
				}}
				onpointerup={() => (miniDrag = false)}
				onpointercancel={() => (miniDrag = false)}
				onwheel={(e) => {
					// Zoom anchored at the art point under the minimap cursor.
					e.preventDefault();
					e.stopPropagation();
					const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
					const px = (e.clientX - r.left) / k;
					const py = (e.clientY - r.top) / k;
					zoomAt(tx + px * s, ty + py * s, Math.exp(-e.deltaY * 0.0015));
				}}
			>
				<div class="mini-art" style="transform: scale({k})">
					<AsciiArt
						text={ansi}
						theme={asciiTheme}
						cols={art.width}
						margin={1}
						cellSize={CELL}
						style="width: auto; height: auto;"
						aria-hidden="true"
					/>
				</div>
				<div
					class="mini-view"
					style="transform: translate({miniRect.x}px, {miniRect.y}px); width: {miniRect.w}px; height: {miniRect.h}px"
				></div>
			</div>
		{/if}

		{#if menuOpen}
			<div
				class="menu"
				role="dialog"
				aria-label="Theme editor"
				tabindex="-1"
				onpointerdown={(e) => e.stopPropagation()}
			>
				<div class="menu-title">theme</div>
				<ThemeEditor bind:theme onreset={() => setMode(dark)} />
			</div>
		{/if}
	</div>

	{#if art && art.warnings.length}
		<div class="warnings">
			{#each art.warnings as w}<div>⚠ {w}</div>{/each}
		</div>
	{/if}

	{#if editOpen && src !== null}
		<!-- the same prompt-style editor as the main page, docked to the bottom;
		     edits re-render live and rewrite the URL -->
		<div class="editor-box">
			<span class="editor-title">Edit me</span>
			<span class="accent">❯</span>
			<textarea
				bind:value={src}
				rows={Math.min(16, Math.max(2, src.split('\n').length))}
				wrap="off"
				spellcheck="false"
				aria-label="Mermaid source"
			></textarea>
		</div>
	{/if}
</div>

<style>
	:global(html),
	:global(body) {
		height: 100%;
		overflow: hidden;
	}
	.viewer {
		height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.5rem 0.9rem;
		flex-wrap: wrap;
	}
	.dim {
		color: var(--dim);
	}
	.err {
		color: var(--err);
	}
	.accent {
		color: var(--accent);
	}
	.spacer {
		flex: 1;
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
	.ghost:hover {
		color: var(--cmd);
	}
	.ghost.active {
		color: var(--accent);
	}

	.stage {
		position: relative;
		flex: 1;
		overflow: hidden;
		background: var(--term-bg);
		cursor: grab;
		touch-action: none;
		user-select: none;
	}
	.stage.dragging {
		cursor: grabbing;
	}
	.note {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.minimap {
		position: absolute;
		left: 0.8rem;
		bottom: 0.8rem;
		overflow: hidden;
		border: 1px solid var(--muted);
		border-radius: 4px;
		background: var(--term-bg);
		box-shadow: 0 4px 16px var(--shadow);
		cursor: crosshair;
		/* slides in from below when the diagram stops fitting the view;
		   permanently promoted so the slide never creates a layer mid-drag —
		   that rasterization was a visible hitch */
		transition: transform 0.18s ease-out;
		will-change: transform;
	}
	.minimap.off {
		transform: translateY(calc(100% + 1.6rem));
		pointer-events: none;
	}
	.mini-art {
		position: absolute;
		transform-origin: 0 0;
		pointer-events: none;
		/* its own layer: the viewport rect moving must not re-raster the art */
		will-change: transform;
	}
	.mini-view {
		position: absolute;
		left: 0;
		top: 0;
		border: 1px solid var(--cmd);
		background: rgba(128, 128, 128, 0.15);
		pointer-events: none;
		will-change: transform;
	}

	.menu {
		position: absolute;
		top: 0.6rem;
		right: 0.8rem;
		z-index: 10;
		padding: 0.7rem 0.9rem;
		background: var(--custom-bg);
		border-radius: 4px;
		box-shadow: 0 6px 20px var(--shadow);
		cursor: auto;
	}
	.menu-title {
		color: var(--purple);
		font-weight: bold;
		margin-bottom: 0.5rem;
	}

	.warnings {
		padding: 0.3rem 0.9rem;
		color: var(--warnc);
		opacity: 0.75;
	}

	/* the editor drawer, DynamicBorder-style like the main page's editor */
	.editor-box {
		margin: 0.6rem 0.9rem 0.9rem;
		border: 1px solid #5f87ff;
		border-radius: 6px;
		padding: 0.45rem 0.7rem;
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		position: relative;
		background: var(--bg);
	}
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
		max-height: 40vh;
		resize: none;
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
</style>
