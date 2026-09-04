import assert from "node:assert/strict";
import test from "node:test";
import { handleEmployeesApi, validateManagerAssignment } from "../src/employees.ts";

function lookupDb(match) {
	const calls = [];
	return {
		calls,
		prepare(sql) {
			const call = { sql, bindings: [] };
			calls.push(call);
			return {
				bind(...bindings) {
					call.bindings = bindings;
					return this;
				},
				async first() {
					return match;
				},
			};
		},
	};
}

function employeePayload(overrides = {}) {
	return {
		id: "new-employee",
		legalFirstName: "New",
		legalLastName: "Employee",
		otherLegalName: "",
		displayName: "New Employee",
		email: "new@example.com",
		branch: "",
		office: "",
		jobTitle: "",
		costCenter: "",
		department: "",
		manager: "Unknown Person",
		joinDate: "",
		pendingJoinDate: "",
		leaveDate: "",
		pendingLeaveDate: "",
		employmentStatus: "Active",
		...overrides,
	};
}

function employeeRow(overrides = {}) {
	return {
		id: "self",
		legal_first_name: "Self",
		legal_last_name: "Employee",
		other_legal_name: "",
		display_name: "Self Employee",
		email: "self@example.com",
		branch: "",
		office: "",
		job_title: "",
		cost_center: null,
		department: "",
		manager: "Former Manager",
		join_date: "",
		pending_join_date: "",
		leave_date: "",
		pending_leave_date: "",
		employment_status: "Active",
		...overrides,
	};
}

function sequenceDb(firstResults) {
	const calls = [];
	return {
		calls,
		prepare(sql) {
			const call = { sql, bindings: [] };
			calls.push(call);
			return {
				bind(...bindings) {
					call.bindings = bindings;
					return this;
				},
				async first() {
					return firstResults.shift() ?? null;
				},
				async run() {
					return { meta: { changes: 1 } };
				},
			};
		},
	};
}

test("server manager lookup is parameterized and excludes the employee", async () => {
	const db = lookupDb({ id: "other-with-same-name" });

	await validateManagerAssignment(db, "Morgan Yu", "self", null);

	assert.equal(db.calls.length, 1);
	assert.match(db.calls[0].sql, /display_name = \?1/);
	assert.match(db.calls[0].sql, /id <> \?2/);
	assert.deepEqual(db.calls[0].bindings, ["Morgan Yu", "self"]);
});

test("server preserves an unchanged legacy manager without requiring a current employee", async () => {
	const db = lookupDb(null);

	await validateManagerAssignment(db, "Former Manager", "self", "Former Manager");

	assert.equal(db.calls.length, 0);
});

test("server rejects a new manager name when no other employee matches", async () => {
	const db = lookupDb(null);

	await assert.rejects(
		validateManagerAssignment(db, "Self Name", "self", null),
		{ message: "Manager must be blank or match an existing employee display name." },
	);
});

test("POST returns a clear 400 for an unknown manager", async () => {
	const db = lookupDb(null);
	const request = new Request("https://example.com/api/employees", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(employeePayload()),
	});

	const response = await handleEmployeesApi(request, db);
	const body = await response.json();

	assert.equal(response.status, 400);
	assert.deepEqual(body, {
		error: "invalid_employee",
		message: "Manager must be blank or match an existing employee display name.",
	});
	assert.deepEqual(db.calls[0].bindings, ["Unknown Person", "new-employee"]);
});

test("PUT returns a clear 400 when changing to an unknown manager", async () => {
	const db = sequenceDb([employeeRow(), null]);
	const request = new Request("https://example.com/api/employees/self", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(employeePayload({ id: "self", manager: "Unknown Person" })),
	});

	const response = await handleEmployeesApi(request, db);
	const body = await response.json();

	assert.equal(response.status, 400);
	assert.equal(body.message, "Manager must be blank or match an existing employee display name.");
	assert.deepEqual(db.calls[1].bindings, ["Unknown Person", "self"]);
});

test("PUT preserves and trims an unchanged legacy manager", async () => {
	const row = employeeRow();
	const db = sequenceDb([row, row]);
	const request = new Request("https://example.com/api/employees/self", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(employeePayload({ id: "self", manager: "  Former Manager  " })),
	});

	const response = await handleEmployeesApi(request, db);

	assert.equal(response.status, 200);
	assert.equal(db.calls.some((call) => /SELECT id FROM employees WHERE display_name/.test(call.sql)), false);
	const update = db.calls.find((call) => /UPDATE employees SET/.test(call.sql));
	assert.equal(update.bindings[11], "Former Manager");
});
