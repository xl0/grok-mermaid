import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { realpathSync } from 'node:fs';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter(),
			// Import lovely-mermaid's source directly (no build step, tracks HEAD).
			alias: {
				'lovely-mermaid': '../packages/lovely-mermaid/src/index.ts'
			},
			paths: { base: (process.env.BASE_PATH as `/${string}` | undefined) ?? '' }
		})
	],
	// The aliased lovely-mermaid source lives outside the demo's vite root.
	// realpathSync keeps the `bun link`ed svelte-asciiart servable during dev;
	// once it is published, a plain install resolves back into node_modules.
	server: { fs: { allow: ['..', realpathSync('node_modules/svelte-asciiart')] } }
});
