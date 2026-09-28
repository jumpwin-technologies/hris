import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const packageJson = new URL("package.json", root);
const tsconfig = new URL("tsconfig.json", root);
const dashboardSource = new URL("src/pages/index.astro", root);
const dashboardHtml = new URL("dist/index.html", root);

const lumosFiles = [
	"LUMOS.md",
	"src/styles/base.css",
	"src/styles/patterns.css",
	"src/styles/utilities.css",
	"src/components/wrapper/Section.astro",
	"src/components/wrapper/Grid.astro",
	"src/components/typography/Heading.astro",
	"src/components/typography/Eyebrow.astro",
	"src/components/Button.astro",
];

test("HRIS records and resolves its Lumos scaffold", async () => {
	const manifest = JSON.parse(await readFile(packageJson, "utf8"));
	const config = JSON.parse(await readFile(tsconfig, "utf8"));

	assert.equal(manifest.lumos?.version, "0.0.4");
	assert.equal(manifest.lumos?.commit, "42d489788b7bf59fadd5f0505cdf783f690da75e");
	assert.deepEqual(config.compilerOptions?.paths?.["@/*"], ["./src/*"]);
	await Promise.all(lumosFiles.map((path) => access(new URL(path, root))));
});

test("the HRIS dashboard is composed with Lumos components", async () => {
	const source = await readFile(dashboardSource, "utf8");

	assert.match(source, /@\/layouts\/AppLayout\.astro/);
	assert.match(source, /@\/components\/content\/HrisDashboard\.astro/);

	const html = await readFile(dashboardHtml, "utf8");
	assert.match(html, /class="[^"]*section[^"]*hris-dashboard_wrap/);
	assert.match(html, /class="[^"]*grid[^"]*metrics/);
	assert.match(html, /class="[^"]*button_wrap[^"]*primary/);
	assert.match(html, /id="employee-rows"/);
	assert.match(html, /id="employee-dialog"/);
	assert.match(html, /id="access-identity-data"/);
});
