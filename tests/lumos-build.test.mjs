import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "astro";

test("Lumos components build with scripts embedded for the custom Worker", async () => {
  const root = new URL("../", import.meta.url);
  const outDir = new URL(".wrangler/lumos-smoke/", root);
  await build({
    root: fileURLToPath(root),
    outDir: fileURLToPath(outDir),
    logLevel: "error",
    integrations: [{
      name: "lumos-test-route",
      hooks: {
        "astro:config:setup": ({ injectRoute }) => injectRoute({
          pattern: "/lumos-smoke",
          entrypoint: "./tests/fixtures/lumos-components.astro",
          prerender: true,
        }),
      },
    }],
  });

  const html = await readFile(new URL("lumos-smoke/index.html", outDir), "utf8");
  assert.match(html, /type="email"[^>]*name="email"/);
  assert.match(html, /id="smoke-dialog"/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /slider_list/);
  assert.match(html, /<script type="module">/);
  assert.match(html, /\.modal_wrap/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"/i);
  assert.doesNotMatch(html, /Hidden field|preview\.lumosframework\.com|example-components/);
});
