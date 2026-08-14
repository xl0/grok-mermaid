import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
export default {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		// Import lovely-mermaid's source directly (no build step, tracks HEAD).
		alias: {
			'lovely-mermaid': '../packages/lovely-mermaid/src/index.ts'
		},
		paths: { base: /** @type {`/${string}` | ''} */ (process.env.BASE_PATH ?? '') }
	}
};
