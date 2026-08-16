<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	// Bundled at build time: full box-drawing coverage (incl. ╭╮╰╯ arcs), so
	// no per-glyph fallback to a mismatched font can misalign the line art.
	import jbmRegular from 'jetbrains-mono/fonts/webfonts/JetBrainsMono-Regular.woff2';
	import jbmBold from 'jetbrains-mono/fonts/webfonts/JetBrainsMono-Bold.woff2';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
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
</svelte:head>

{@render children()}

<style>
	/* the page palette; body.light re-skins everything, terminal panel
	   (--term-bg/--term-fg) included — shared by every route */
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
</style>
