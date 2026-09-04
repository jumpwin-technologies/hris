(function (global) {
	"use strict";

	function normalizeManager(value) {
		return String(value ?? "").trim();
	}

	function managerCandidates(employees, editingId) {
		return [...new Set(
			employees
				.filter((employee) => !editingId || employee.id !== editingId)
				.map((employee) => normalizeManager(employee.displayName))
				.filter(Boolean),
		)].sort();
	}

	function isManagerAllowed(value, candidates, preservedManager) {
		const manager = normalizeManager(value);
		return !manager
			|| candidates.includes(manager)
			|| (preservedManager !== null && manager === normalizeManager(preservedManager));
	}

	function nextManagerIndex(currentIndex, optionCount, direction) {
		if (!optionCount) return -1;
		if (currentIndex < 0) return direction < 0 ? optionCount - 1 : 0;
		return (currentIndex + direction + optionCount) % optionCount;
	}

	global.managerComboboxHelpers = Object.freeze({
		isManagerAllowed,
		managerCandidates,
		nextManagerIndex,
		normalizeManager,
	});
})(globalThis);
