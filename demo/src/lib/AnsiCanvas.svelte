<script lang="ts">
	import { clusters, clusterWidth } from 'lovely-ansi-svg';
	import { contrastOn, type MermaidArt, resolveClassStyle, type Role } from 'lovely-mermaid';
	import { type RoleKey, type RoleStyle, swatch, TERM } from './theme';

	/**
	 * Canvas prototype of the viewer stage: draws `art.styled` as a cell grid
	 * under a translate+scale camera. Per-frame cost is proportional to the
	 * *visible* cells, and zoom re-draws text at full crispness instead of
	 * re-rasterizing an SVG. Zoomed far out it blits a cached scale-1 bitmap.
	 */
	interface Cell {
		ch: string;
		w: number;
		fg: string;
		bg: string | null;
		bold: boolean;
	}

	let {
		art,
		theme,
		dark,
		cell = 15,
		margin = 1,
		s,
		tx,
		ty
	}: {
		art: MermaidArt;
		theme: Record<RoleKey, RoleStyle>;
		dark: boolean;
		cell?: number;
		margin?: number;
		s: number;
		tx: number;
		ty: number;
	} = $props();

	const cw = $derived(cell * 0.6);
	const term = $derived(TERM[dark ? 'dark' : 'light']);

	// --- colors -------------------------------------------------------------
	const hex = (c: string): [number, number, number] => [
		parseInt(c.slice(1, 3), 16),
		parseInt(c.slice(3, 5), 16),
		parseInt(c.slice(5, 7), 16)
	];
	function mix(a: string, b: string, t: number): string {
		const [ar, ag, ab] = hex(a);
		const [br, bg2, bb] = hex(b);
		const ch = (x: number, y: number) =>
			Math.round(x + (y - x) * t)
				.toString(16)
				.padStart(2, '0');
		return `#${ch(ar, br)}${ch(ag, bg2)}${ch(ab, bb)}`;
	}

	/** Resolved paint for one span: theme by role, classDefs overriding —
	 * the same mapping `classSgr` applies for terminals. */
	function styleFor(role: Role, classes: string[] | undefined): Omit<Cell, 'ch' | 'w'> {
		const base = role === 'none' ? null : theme[role as RoleKey];
		let fg = base === null || base.color === null ? term.fg : swatch(base.color);
		let bg = base === null || base.bg === null ? null : swatch(base.bg);
		let bold = base?.bold ?? false;
		if (base?.dim) fg = mix(fg, term.bg, 0.45);
		const cls = resolveClassStyle(classes, art.classDefs);
		if (cls !== null) {
			const clsFg = role === 'border' ? (cls.stroke ?? cls.color) : role === 'edge' ? undefined : cls.color;
			if (clsFg !== undefined) fg = clsFg;
			else if (cls.fill !== undefined) fg = contrastOn(cls.fill);
			if (cls.fill !== undefined) bg = cls.fill;
			if (cls.bold) bold = true;
		}
		return { fg, bg, bold };
	}

	// --- the cell grid, rebuilt on art or theme change ------------------------
	const grid = $derived.by(() => {
		return art.styled.map((row) => {
			const cells: (Cell | null)[] = [];
			for (const span of row) {
				const paint = styleFor(span.role, span.classes);
				for (const ch of clusters(span.text)) {
					const w = clusterWidth(ch);
					if (w === 0) continue;
					// blank cells paint only when a class fills them
					cells.push(ch === ' ' && paint.bg === null ? null : { ch, w, ...paint });
					if (w === 2) cells.push(null);
				}
			}
			return cells;
		});
	});

	// --- drawing --------------------------------------------------------------
	let el: HTMLCanvasElement | undefined = $state();
	let vw = $state(0);
	let vh = $state(0);

	function drawCells(
		ctx: CanvasRenderingContext2D,
		c0: number,
		c1: number,
		r0: number,
		r1: number
	) {
		const font = (bold: boolean) =>
			`${bold ? '700' : '400'} ${cell}px 'JetBrains Mono', ui-monospace, monospace`;
		ctx.textBaseline = 'middle';
		// backgrounds first so a fill never covers a neighbour's glyph
		for (let r = r0; r <= r1; r++) {
			const row = grid[r];
			if (!row) continue;
			const y = (r + margin) * cell;
			for (let c = c0; c <= Math.min(c1, row.length - 1); c++) {
				const cellV = row[c];
				if (cellV?.bg) {
					ctx.fillStyle = cellV.bg;
					ctx.fillRect((c + margin) * cw, y, cellV.w * cw, cell);
				}
			}
		}
		let curFill = '';
		let curBold: boolean | null = null;
		for (let r = r0; r <= r1; r++) {
			const row = grid[r];
			if (!row) continue;
			const y = (r + margin) * cell + cell / 2;
			for (let c = c0; c <= Math.min(c1, row.length - 1); c++) {
				const cellV = row[c];
				if (!cellV || cellV.ch === ' ') continue;
				if (cellV.bold !== curBold) {
					curBold = cellV.bold;
					ctx.font = font(curBold);
				}
				if (cellV.fg !== curFill) {
					curFill = cellV.fg;
					ctx.fillStyle = curFill;
				}
				ctx.fillText(cellV.ch, (c + margin) * cw, y);
			}
		}
	}

	// A scale-1 bitmap of the whole art, redrawn when the grid changes; far
	// zoom-out blits this instead of drawing every visible cell.
	const bitmap = $derived.by(() => {
		const w = Math.ceil((art.width + 2 * margin) * cw);
		const h = (grid.length + 2 * margin) * cell;
		const off = document.createElement('canvas');
		off.width = w;
		off.height = h;
		const ctx = off.getContext('2d');
		if (ctx) {
			ctx.fillStyle = term.bg;
			ctx.fillRect(0, 0, w, h);
			drawCells(ctx, 0, art.width - 1, 0, grid.length - 1);
		}
		return off;
	});

	$effect(() => {
		const c = el;
		if (!c || vw === 0 || vh === 0) return;
		const dpr = window.devicePixelRatio || 1;
		const pw = Math.round(vw * dpr);
		const ph = Math.round(vh * dpr);
		if (c.width !== pw) c.width = pw;
		if (c.height !== ph) c.height = ph;
		const ctx = c.getContext('2d');
		if (!ctx) return;

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.fillStyle = term.bg;
		ctx.fillRect(0, 0, vw, vh);

		ctx.setTransform(dpr * s, 0, 0, dpr * s, tx * dpr, ty * dpr);
		if (s < 0.75) {
			// far out every cell is visible; the cached bitmap is cheaper
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(bitmap, 0, 0);
			return;
		}
		const c0 = Math.max(0, Math.floor(-tx / s / cw) - margin);
		const c1 = Math.ceil((vw - tx) / s / cw);
		const r0 = Math.max(0, Math.floor(-ty / s / cell) - margin);
		const r1 = Math.min(grid.length - 1, Math.ceil((vh - ty) / s / cell));
		drawCells(ctx, c0, c1, r0, r1);
	});
</script>

<canvas bind:this={el} bind:clientWidth={vw} bind:clientHeight={vh} aria-label="Rendered diagram"
></canvas>

<style>
	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
