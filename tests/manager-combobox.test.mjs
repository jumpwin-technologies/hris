import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const dashboardHtml = new URL("../dist/index.html", import.meta.url);
const helperSource = new URL("../src/scripts/manager-combobox.js", import.meta.url);

async function loadHelpers() {
	const source = await readFile(helperSource, "utf8");
	const context = { globalThis: {} };
	vm.runInNewContext(source, context);
	return context.globalThis.managerComboboxHelpers;
}

test("manager candidates exclude the edited employee and collapse duplicate display names", async () => {
	const { managerCandidates } = await loadHelpers();
	const employees = [
		{ id: "self", displayName: "Alex Lee" },
		{ id: "duplicate", displayName: "Alex Lee" },
		{ id: "boss", displayName: "  Morgan Yu  " },
	];

	assert.deepEqual([...managerCandidates(employees, "self")], ["Alex Lee", "Morgan Yu"]);
	assert.deepEqual([...managerCandidates(employees, "duplicate")], ["Alex Lee", "Morgan Yu"]);
});

test("manager validation permits blank, listed, and unchanged legacy values only", async () => {
	const { isManagerAllowed } = await loadHelpers();
	const candidates = ["Morgan Yu"];

	assert.equal(isManagerAllowed("   ", candidates, "Former Manager"), true);
	assert.equal(isManagerAllowed(" Morgan Yu ", candidates, "Former Manager"), true);
	assert.equal(isManagerAllowed(" Former Manager ", candidates, "Former Manager"), true);
	assert.equal(isManagerAllowed("Unlisted Person", candidates, "Former Manager"), false);
	assert.equal(isManagerAllowed("Former Manager", candidates, null), false);
});

test("manager normalization trims before submission and ArrowUp starts at the last option", async () => {
	const { normalizeManager, nextManagerIndex } = await loadHelpers();

	assert.equal(normalizeManager("  Morgan Yu  "), "Morgan Yu");
	assert.equal(normalizeManager("   "), "");
	assert.equal(nextManagerIndex(-1, 3, -1), 2);
	assert.equal(nextManagerIndex(-1, 3, 1), 0);
	assert.equal(nextManagerIndex(0, 3, -1), 2);
});

test("built combobox exposes synchronized keyboard and focus semantics", async () => {
	const html = await readFile(dashboardHtml, "utf8");

	assert.match(html, /id="manager-toggle"[^>]+aria-controls="manager-options"[^>]+aria-expanded="false"/);
	assert.doesNotMatch(html, /id="manager-toggle"[^>]+tabindex="-1"/);
	assert.match(html, /option\.tabIndex\s*=\s*-1/);
	assert.match(html, /managerToggle\.setAttribute\(['"]aria-expanded['"]/);
	assert.match(html, /event\.key === ['"]Escape['"][\s\S]*?event\.preventDefault\(\)/);
});
