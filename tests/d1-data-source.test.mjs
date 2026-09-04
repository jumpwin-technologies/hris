import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const dashboardHtml = new URL("../dist/index.html", import.meta.url);
const dashboardSource = new URL("../src/pages/index.astro", import.meta.url);
const legacyWorkbook = new URL("../src/data/workbook.json", import.meta.url);

test("the deployed dashboard inlines the D1-loading client", async () => {
	const html = await readFile(dashboardHtml, "utf8");

	assert.match(html, /fetch\(url, options\)/);
	assert.match(html, /['"]\/api\/employees['"]/);
	assert.doesNotMatch(html, /<script[^>]+src=["'][^"']+["']/i);
});

test("no local employee data source remains", async () => {
	const source = await readFile(dashboardSource, "utf8");

	await assert.rejects(access(legacyWorkbook), { code: "ENOENT" });
	assert.doesNotMatch(source, /workbook\.json|localStorage/);
});
