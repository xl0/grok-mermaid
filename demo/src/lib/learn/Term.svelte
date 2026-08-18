<script lang="ts">
	import type { Snippet } from 'svelte';

	// A terminology admonition for the /learn pages: introduced where the
	// term first appears, so paragraphs don't stop to define words. With
	// `href` it doubles as a reference card — the name links to the source
	// (paper, article) and the body is a 1–2 line summary.
	let { name, href, children }: { name: string; href?: string; children: Snippet } = $props();
</script>

<aside class="term">
	{#if href}
		<a class="name" {href} target="_blank" rel="noreferrer">{name} ↗</a>
	{:else}
		<span class="name">{name}</span>
	{/if}
	<span class="def">{@render children()}</span>
</aside>

<style>
	.term {
		display: flex;
		gap: 0.7rem;
		align-items: baseline;
		margin: 0.7rem 0;
		padding: 0.45rem 0.7rem;
		border: 1px dashed var(--muted);
		border-radius: 5px;
		font-size: 0.9rem;
		color: var(--dim);
	}
	.name {
		flex-shrink: 0;
		color: var(--purple);
		font-weight: bold;
	}
	a.name {
		text-decoration: none;
	}
	a.name:hover {
		text-decoration: underline;
	}
	.def :global(code) {
		font-size: 0.92em;
		background: var(--custom-bg);
		border-radius: 3px;
		padding: 0 0.25em;
	}
</style>
