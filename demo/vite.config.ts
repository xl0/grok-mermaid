import { sveltekit } from '@sveltejs/kit/vite';
import { existsSync, realpathSync } from 'node:fs';
import { defineConfig } from 'vite';

// The aliased lovely-mermaid source lives outside the demo's vite root, and
// the `bun link`ed svelte-asciiart (plus its lovely-ansi-svg core, linked one
// level deeper) must stay servable during dev. Once both are published, plain
// installs resolve inside node_modules and the realpaths degenerate to it.
const linked = [
	'node_modules/svelte-asciiart',
	'node_modules/svelte-asciiart/node_modules/lovely-ansi-svg'
]
	.filter(existsSync)
	.map((p) => realpathSync(p));

export default defineConfig({
	plugins: [sveltekit()],
	server: { fs: { allow: ['..', ...linked] } }
});
