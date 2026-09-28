// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	// src/worker.ts serves the generated HTML and handles Access and D1.
	output: "static",
	compressHTML: true,
	vite: {
		build: {
			cssTarget: "safari15.4",
			// Lumos scripts travel with the HTML embedded in the Worker.
			assetsInlineLimit: (file) => file.endsWith(".js") ? true : undefined,
		},
	},
	build: {
		// The generated page is bundled into the Worker so ctx.access is available
		// without Cloudflare's Static Assets router sitting in front of it.
		inlineStylesheets: "always",
	},
});
