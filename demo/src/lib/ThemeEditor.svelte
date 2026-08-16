<script lang="ts">
	import { ROLE_KEYS, type RoleKey, type RoleStyle, type Slot, swatch } from './theme';

	let {
		theme = $bindable(),
		onreset
	}: { theme: Record<RoleKey, RoleStyle>; onreset: () => void } = $props();

	let paletteFor = $state<{ c: RoleKey; slot: Slot } | null>(null);
</script>

<svelte:window
	onclick={() => (paletteFor = null)}
	onkeydown={(e) => {
		if (e.key === 'Escape') paletteFor = null;
	}}
/>

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
	<button class="ghost" onclick={onreset}>[reset]</button>
</div>

<style>
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
	.ghost {
		font: inherit;
		border: none;
		background: none;
		color: var(--ghost);
		cursor: pointer;
		padding: 0;
	}
	.ghost:hover {
		color: var(--cmd);
	}
</style>
