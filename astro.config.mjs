// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
	build: {
		// The generated page is bundled into the Worker so ctx.access is available
		// without Cloudflare's Static Assets router sitting in front of it.
		inlineStylesheets: "always",
	},
});
