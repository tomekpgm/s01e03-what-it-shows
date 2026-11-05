import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// SvelteKit 3 takes its config here, not in svelte.config.js.
export default defineConfig({
  plugins: [
    sveltekit({
      extensions: ['.svelte', '.svx'],
      preprocess: [
        vitePreprocess(),
        mdsvex({
          extensions: ['.svx'],
          // Frontmatter `layout: runbook` picks this frame (README: "the frame every page shares").
          layout: { runbook: fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url)) },
        }),
      ],
      adapter: adapter({ pages: 'build', assets: 'build', strict: true }),
      // README: logic in src/lib, imported as #lib/…
      alias: { '#lib': 'src/lib' },
      // There is no page at /; start the crawl at the kb index and follow its links.
      prerender: { entries: ['/kb', '/kb/incidents/4471/problems'] },
    }),
  ],
});
