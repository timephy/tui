import adapter from "@sveltejs/adapter-node"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://kit.svelte.dev/docs/integrations#preprocessors
    // for more information about preprocessors
    preprocess: vitePreprocess(),

    kit: {
        adapter: adapter({
            strict: true,
            fallback: "index.html",
            pages: "build",
            precompress: true,
        }),
    },
    compilerOptions: {
        // TODO: svelte-awesome does not yet support runes mode
        // runes: true,
    },
}

export default config
