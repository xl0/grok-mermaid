<script lang="ts">
	import { base } from '$app/paths';
	import DiagramViewer from '$lib/DiagramViewer.svelte';
	import Term from '$lib/learn/Term.svelte';

	// ---- the layer-juggling widget -----------------------------------------
	// A fixed 6-node DAG; each node has a fixed column, the reader drags it
	// vertically between layer bands. Counters track validity, total span and
	// dummy count. The two preset layerings match what the engine's
	// NETWORK_SIMPLEX / LONGEST_PATH strategies produce (verified).
	const LN = ['a', 'b', 'c', 'd', 'e', 'f'];
	const LX: Record<string, number> = { a: 120, b: 250, c: 120, d: 120, e: 185, f: 330 };
	const LE: [string, string][] = [
		['a', 'c'],
		['b', 'c'],
		['c', 'd'],
		['d', 'e'],
		['a', 'f'],
		['b', 'f'],
		['f', 'e']
	];
	const NLAYERS = 5;
	const START: Record<string, number> = { a: 0, b: 0, c: 1, d: 2, e: 4, f: 2 };
	const MIN_SPAN: Record<string, number> = { a: 0, b: 0, c: 1, d: 2, e: 3, f: 1 };
	const LONGEST_PATH: Record<string, number> = { a: 0, b: 0, c: 1, d: 2, e: 3, f: 2 };
	let layers = $state({ ...START });
	const BY = (r: number) => 40 + 65 * r;
	let dragL = $state<string | null>(null);
	let dragY = $state(0);
	let laySvg: SVGSVGElement | undefined = $state();
	const yOf = (n: string): number => (n === dragL ? dragY : BY(layers[n]));
	const spanOf = ([u, v]: [string, string]): number => layers[v] - layers[u];
	const nBad = $derived(LE.filter((e) => spanOf(e) < 1).length);
	const totSpan = $derived(LE.reduce((s, e) => s + spanOf(e), 0));
	const nDummy = $derived(LE.reduce((s, e) => s + Math.max(0, spanOf(e) - 1), 0));
	// Shorten an edge so the arrowhead stops at the node circle.
	const ledge = ([u, v]: [string, string]) => {
		const x1 = LX[u];
		const y1 = yOf(u);
		const x2 = LX[v];
		const y2 = yOf(v);
		const dx = x2 - x1;
		const dy = y2 - y1;
		const len = Math.hypot(dx, dy) || 1;
		return {
			x1: x1 + (dx * 18) / len,
			y1: y1 + (dy * 18) / len,
			x2: x2 - (dx * 24) / len,
			y2: y2 - (dy * 24) / len
		};
	};
	// Dummy dots: where a long edge crosses each intermediate layer band.
	const dots = ([u, v]: [string, string]): { x: number; y: number }[] => {
		if (spanOf([u, v]) < 2) return [];
		const out = [];
		for (let r = layers[u] + 1; r < layers[v]; r++) {
			const t = (BY(r) - yOf(u)) / (yOf(v) - yOf(u) || 1);
			out.push({ x: LX[u] + (LX[v] - LX[u]) * t, y: yOf(u) + (yOf(v) - yOf(u)) * t });
		}
		return out;
	};
	const ARENA_H = 340;
	function svgY(e: PointerEvent): number {
		if (!laySvg) return 0;
		const r = laySvg.getBoundingClientRect();
		return ((e.clientY - r.top) / r.height) * ARENA_H;
	}
	function grab(n: string, e: PointerEvent) {
		dragL = n;
		dragY = svgY(e);
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
	}
	function dragMove(e: PointerEvent) {
		if (dragL === null) return;
		dragY = Math.max(BY(0), Math.min(BY(NLAYERS - 1), svgY(e)));
		layers[dragL] = Math.round((dragY - 40) / 65);
	}
	function drop() {
		dragL = null;
	}

	// ---- playground -------------------------------------------------------
	const PIPE = `graph TD
  src[source] --> lex
  lex --> parse
  parse --> types[typecheck]
  types --> opt[optimize]
  opt --> gen[codegen]
  gen --> link
  src --> cfg[config]
  cfg --> link
  src --> assets
  assets --> pack[package]
  link --> pack
  types --> lint
  lint --> pack`;
	let playSrc = $state(PIPE);
	let playLay = $state('NETWORK_SIMPLEX');
	const lay = (v: string) => ({ 'elk.layered.layering.strategy': v });
</script>

<svelte:head>
	<title>learn — layering</title>
</svelte:head>

{#snippet layfig(rk: Record<string, number>)}
	{@const H = 40 + 65 * (Math.max(...Object.values(rk)) + 1) - 25}
	<svg viewBox="0 0 460 {H}" class="figsvg" role="img" aria-label="Layering result">
		{#each Array.from({ length: Math.max(...Object.values(rk)) + 1 }) as _, r}
			<rect x="4" y={BY(r) - 20} width="452" height="40" class="band" />
			<text x="8" y={BY(r) - 6} class="bandlabel">layer {r}</text>
		{/each}
		{#each LE as e}
			{@const x1 = LX[e[0]]}
			{@const y1 = BY(rk[e[0]])}
			{@const x2 = LX[e[1]]}
			{@const y2 = BY(rk[e[1]])}
			{@const len = Math.hypot(x2 - x1, y2 - y1) || 1}
			<line
				x1={x1 + ((x2 - x1) * 16) / len}
				y1={y1 + ((y2 - y1) * 16) / len}
				x2={x2 - ((x2 - x1) * 22) / len}
				y2={y2 - ((y2 - y1) * 22) / len}
				class="edge"
				marker-end="url(#arr)"
			/>
			{#each Array.from({ length: Math.max(0, rk[e[1]] - rk[e[0]] - 1) }) as _, i}
				{@const t = (BY(rk[e[0]] + 1 + i) - y1) / (y2 - y1)}
				<circle cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r="4" class="dummy" />
			{/each}
		{/each}
		{#each LN as n}
			<circle cx={LX[n]} cy={BY(rk[n])} r="13" class="pill" />
			<text x={LX[n]} y={BY(rk[n]) + 4}>{n}</text>
		{/each}
	</svg>
{/snippet}

<div class="page">
	<p class="crumbs"><a href="{base}/learn">learn</a> <span class="dim">/ layering</span></p>
	<h1>Layering</h1>
	<p class="lede">
		<a href="{base}/learn/cycle-breaking">Cycle breaking</a> left us a DAG. Layering spends
		it: every node gets a <b>layer</b> — a row number — and the one hard rule is that every
		edge must point strictly downward, from a lower layer to a higher one. That rule alone
		leaves enormous freedom, and this page is about how that freedom gets spent.
	</p>
	<Term name="layer">
		The row a node is assigned to; layer 0 is the top row. Not Photoshop layers — nothing is
		stacked in z here, a layer is a row on the page. graphviz calls the same thing a
		<em>rank</em>, and "level" also appears in the literature.
	</Term>

	<h2>Three prices, pick two</h2>
	<p>
		Any assignment with all edges pointing down is <em>valid</em>, so validity is cheap —
		put every node on its own layer and you are done. Good is harder. A layering is judged on
		three counts: <b>height</b> (how many layers), <b>total edge span</b> (how many layers all
		the edges cross, added up), and <b>width</b> (how much sits on each layer — real nodes
		plus dummy nodes). The three pull against each other:
		squeezing height stretches edges, shortening edges can pile nodes onto the same layer.
	</p>
	<Term name="edge span">
		The number of layers an edge crosses: layer(target) − layer(source). Span 1 is the ideal —
		the edge connects adjacent rows. Total span is the usual single number for "how short are
		the edges".
	</Term>
	<p>
		There is one more cost, and it is the important one. An edge with span 3 does not stay a
		single line: at each of the 2 layers it skips, the engine inserts a <b>dummy node</b> — an
		invisible placeholder that the later phases treat exactly like a node. The reason is that
		those phases only ever reason about one layer at a time: they order nodes within a layer,
		then pick coordinates for them. A long edge passing through a layer it has no node in
		would be invisible to that machinery — nothing would count its crossings, keep nodes out
		of its way, or reserve room for it. The dummy is the edge's stand-in, giving it a seat in
		every layer it crosses. The price: a dummy occupies a slot in its layer, pushes real nodes
		apart, and every one is a potential bend in the final edge. A layer's true width is real
		nodes <em>plus</em> dummies. This is the bill promised last lesson: long edges quietly
		cost width.
	</p>
	<Term name="dummy node">
		A placeholder inserted at every intermediate layer of a long edge, splitting it into span-1
		pieces. Invisible in the output, fully present in every computation between layering and
		routing.
	</Term>

	<h2>Try it</h2>
	<p>
		Seven edges, five rows to play with. Drag nodes between rows — red edges point the wrong
		way and must be fixed first. The dots are the dummy nodes; watch them appear the moment an
		edge skips a row. The starting position is valid but wasteful: total span 11. The minimum
		is 8 — find it.
	</p>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg
		bind:this={laySvg}
		viewBox="0 0 460 {ARENA_H}"
		class="arena"
		role="application"
		aria-label="Drag nodes between layers"
	>
		<defs>
			<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
				<path d="M 0 0 L 10 5 L 0 10 z" class="arrhead" />
			</marker>
			<marker id="arr-up" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
				<path d="M 0 0 L 10 5 L 0 10 z" class="arrhead-up" />
			</marker>
		</defs>
		{#each Array.from({ length: NLAYERS }) as _, r}
			<rect x="4" y={BY(r) - 22} width="452" height="44" class="band" />
			<text x="8" y={BY(r) - 8} class="bandlabel">layer {r}</text>
		{/each}
		{#each LE as e}
			{@const l = ledge(e)}
			<line
				x1={l.x1}
				y1={l.y1}
				x2={l.x2}
				y2={l.y2}
				class="edge"
				class:up={spanOf(e) < 1}
				marker-end={spanOf(e) < 1 ? 'url(#arr-up)' : 'url(#arr)'}
			/>
			{#each dots(e) as d}
				<circle cx={d.x} cy={d.y} r="4" class="dummy" />
			{/each}
		{/each}
		{#each LN as n}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<g
				class="grab"
				class:lift={n === dragL}
				onpointerdown={(ev) => grab(n, ev)}
				onpointermove={dragMove}
				onpointerup={drop}
				onpointercancel={drop}
			>
				<circle cx={LX[n]} cy={yOf(n)} r="15" class="pill" />
				<text x={LX[n]} y={yOf(n) + 5}>{n}</text>
			</g>
		{/each}
	</svg>
	<div class="statbar">
		<span>wrong-way edges: <b class:bad={nBad > 0}>{nBad}</b></span>
		<span>
			total span: <b class:good={nBad === 0 && totSpan === 8}>{nBad > 0 ? '–' : totSpan}</b>
			<span class="dim">(minimum: 8)</span>
		</span>
		<span>dummies: <b>{nBad > 0 ? '–' : nDummy}</b></span>
		<button class="ghost" onclick={() => (layers = { ...LONGEST_PATH })}>[longest path]</button>
		<button class="ghost" onclick={() => (layers = { ...MIN_SPAN })}>[min span]</button>
		<button class="ghost" onclick={() => (layers = { ...START })}>[reset]</button>
	</div>
	<p>
		Two things worth noticing while you drag. Node <code>f</code> has slack — both layer 1 and
		layer 2 are valid — and the choice is not free: layer 1 costs one dummy, layer 2 costs two.
		And pulling <code>e</code> down to layer 4 changes nothing about validity while quietly
		adding a dummy per incoming edge. Valid is easy; cheap takes bookkeeping.
	</p>

	<h2>How engines choose</h2>
	<p>
		The two classic answers, applied to the same graph — dummies drawn in:
	</p>
	<div class="row">
		<figure>
			{@render layfig(LONGEST_PATH)}
			<figcaption>
				<b>Longest path</b>: layer = the longest chain of edges below the node. One graph
				traversal, minimal height, and zero regard for span — <code>f</code> lands next to
				<code>d</code>, span 9, two dummies. Nodes with slack sink as low as they can go.
			</figcaption>
		</figure>
		<figure>
			{@render layfig(MIN_SPAN)}
			<figcaption>
				<b>Minimum span</b> (network simplex): solve for the layering with the smallest
				total span — span 8, one dummy. Same height here, but earned rather than stumbled
				into. This is the default in most engines.
			</figcaption>
		</figure>
	</div>
	<Term name="Gansner, Koutsofios, North & Vo (1993)" href="https://doi.org/10.1109/32.221135">
		<em>A Technique for Drawing Directed Graphs</em> — the <code>dot</code> paper. Formulates
		layering as an optimization problem and solves it with a network simplex, plus much of the
		rest of the pipeline these lessons cover.
	</Term>
	<p>
		There are also strategies that target width directly — cap how many nodes a layer may hold
		and fill layers like a scheduler assigning jobs to time slots (Coffman–Graham is the
		classic). They have a blind spot: the cap counts <em>real</em> nodes, and on real diagrams
		the dummies often outnumber them. A layering that proudly holds every layer to three nodes
		can still come out wider than the default, because the long edges it created fill the
		layers with dummies. We have measured exactly that on a corpus of real-world diagrams.
	</p>
	<Term name="Coffman & Graham (1972)" href="https://doi.org/10.1007/BF00288685">
		<em>Optimal scheduling for two-processor systems</em> — a scheduling algorithm, later
		borrowed by graph drawing for layering with a width limit.
	</Term>

	<h2>Playground</h2>
	<p>
		A build pipeline with three nodes of slack: <code>config</code>, <code>assets</code> and
		<code>lint</code> each have a valid home on several layers. Watch where each strategy puts
		them. Then add <code>src --&gt; pack</code> and follow the new edge through five layers of
		dummies — every kink along the way is one.
	</p>
	<div class="play">
		<div class="controls">
			<textarea bind:value={playSrc} rows="14" spellcheck="false" aria-label="Mermaid source"
			></textarea>
			<label>
				<span class="dim">layering</span>
				<select bind:value={playLay}>
					<option>NETWORK_SIMPLEX</option>
					<option>LONGEST_PATH</option>
					<option>COFFMAN_GRAHAM</option>
					<option>MIN_WIDTH</option>
				</select>
			</label>
		</div>
		<div class="fig play-fig">
			<DiagramViewer src={playSrc} elkExtra={lay(playLay)} />
		</div>
	</div>

	<h2>Takeaways</h2>
	<ul>
		<li>Layering assigns each node a layer; the only rule is that every edge points strictly down. Valid is trivial; good is a trade.</li>
		<li>The currencies: height, total edge span, and width — and width is counted with the dummies in.</li>
		<li>An edge spanning k layers becomes k−1 dummy nodes: slots taken, bends risked, width spent.</li>
		<li>Longest path minimizes height in one pass; network simplex minimizes span; width caps count only the nodes you can see, which is their undoing.</li>
	</ul>
	<p class="dim">
		Next: crossing minimization — where the spaghetti is fought, one layer pair at a time.
	</p>
</div>

<style>
	.page {
		max-width: 52rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
		line-height: 1.55;
	}
	.crumbs a,
	a {
		color: var(--cmd);
	}
	h1 {
		font-size: 1.4rem;
	}
	h2 {
		font-size: 1.1rem;
		margin-top: 2.2rem;
		color: var(--accent);
	}
	.lede {
		font-size: 1.05rem;
	}
	.dim {
		color: var(--dim);
	}
	code {
		font-size: 0.92em;
		background: var(--custom-bg);
		border-radius: 3px;
		padding: 0 0.25em;
	}

	.fig {
		height: 24rem;
		border: 1px solid var(--muted);
		border-radius: 6px;
		overflow: hidden;
		margin: 1rem 0;
	}
	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		align-items: start;
	}
	@media (max-width: 40rem) {
		.row {
			grid-template-columns: 1fr;
		}
	}
	.row figure {
		margin: 0;
	}
	figcaption {
		font-size: 0.9rem;
		color: var(--dim);
	}
	figcaption b {
		color: var(--fg);
	}

	.figsvg {
		width: 100%;
		max-width: 26rem;
		display: block;
		margin: 0 auto 0.4rem;
	}
	.figsvg text,
	.arena text {
		fill: var(--fg);
		font-size: 13px;
		text-anchor: middle;
	}
	.edge {
		fill: none;
		stroke: var(--accent);
		stroke-width: 1.4;
	}
	.edge.up {
		stroke: var(--err);
	}
	.arrhead {
		fill: var(--accent);
	}
	.arrhead-up {
		fill: var(--err);
	}
	.pill {
		fill: var(--custom-bg);
		stroke: var(--fg);
	}
	.band {
		fill: color-mix(in srgb, var(--accent) 8%, transparent);
	}
	.bandlabel {
		fill: var(--dim);
		font-size: 10px;
		text-anchor: start;
	}
	.dummy {
		fill: var(--dim);
	}

	.arena {
		width: 100%;
		max-width: 34rem;
		display: block;
		margin: 0 auto;
		touch-action: none;
	}
	.grab {
		cursor: grab;
	}
	.grab.lift .pill {
		stroke: var(--accent);
		stroke-width: 2;
	}
	.grab text {
		user-select: none;
	}
	.statbar {
		display: flex;
		gap: 1.4rem;
		align-items: baseline;
		justify-content: center;
		margin: 0.4rem 0 0;
	}
	.statbar .good {
		color: var(--accent);
	}
	.statbar .bad {
		color: var(--err);
	}
	.ghost {
		font: inherit;
		border: none;
		background: none;
		color: var(--cmd);
		cursor: pointer;
		padding: 0;
	}

	.play {
		display: grid;
		grid-template-columns: minmax(16rem, 24rem) 1fr;
		gap: 1rem;
		align-items: start;
	}
	.play-fig {
		margin: 0;
		height: 30rem;
	}
	.controls textarea {
		width: 100%;
		box-sizing: border-box;
		font: inherit;
		font-size: 0.9rem;
		font-variant-ligatures: none;
		background: var(--custom-bg);
		color: var(--fg);
		border: 1px solid var(--muted);
		border-radius: 4px;
		padding: 0.5rem;
		resize: vertical;
	}
	.controls label {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		margin-top: 0.5rem;
	}
	.controls select {
		font: inherit;
		font-size: 0.9rem;
		background: var(--bg);
		color: var(--fg);
		border: 1px solid var(--muted);
		border-radius: 3px;
	}
	@media (max-width: 52rem) {
		.play {
			grid-template-columns: 1fr;
		}
	}
</style>
