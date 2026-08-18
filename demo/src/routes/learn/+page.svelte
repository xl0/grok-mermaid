<script lang="ts">
	import { base } from '$app/paths';

	const topics = [
		{
			slug: 'drawing-graphs',
			title: 'Drawing graphs',
			blurb: 'what layout is, the families, why layered'
		},
		{ slug: 'cycle-breaking', title: 'Cycle breaking', blurb: 'which edge renders against the flow' },
		{ slug: 'layering', title: 'Layering', blurb: 'layers, dummy nodes, the cost of long edges' },
		{ slug: null, title: 'Crossing minimization', blurb: 'ordering within layers' },
		{ slug: null, title: 'Node placement', blurb: 'the width vs symmetry trade' },
		{ slug: null, title: 'Edge routing', blurb: 'channels and tracks' },
		{ slug: null, title: 'Compound graphs', blurb: 'clusters, piercing, inflation' },
		{ slug: null, title: 'The terminal grid', blurb: 'from float coordinates to cells' }
	];
</script>

<svelte:head>
	<title>lovely-mermaid — learn</title>
</svelte:head>

<div class="page">
	<h1><span class="accent">lovely-mermaid</span> <span class="dim">/ learn</span></h1>
	<p class="dim">
		How layered graph layout actually works, one topic per page — claims demonstrated, not
		asserted.
	</p>
	<ol start="0">
		{#each topics as t}
			<li>
				{#if t.slug}
					<a href="{base}/learn/{t.slug}">{t.title}</a>
					<span class="dim">— {t.blurb}</span>
				{:else}
					<span class="dim">{t.title} — {t.blurb} <em>(upcoming)</em></span>
				{/if}
			</li>
		{/each}
	</ol>
</div>

<style>
	.page {
		max-width: 46rem;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
	}
	h1 {
		font-size: 1.2rem;
		font-weight: normal;
	}
	.accent {
		color: var(--accent);
	}
	.dim {
		color: var(--dim);
	}
	ol {
		line-height: 2;
	}
	a {
		color: var(--cmd);
	}
</style>
