export type EmploymentStatus = "Active" | "Onboarding" | "Departing" | "Inactive";

export type Employee = {
	id: string;
	legalFirstName: string;
	legalLastName: string;
	otherLegalName: string;
	displayName: string;
	email: string;
	branch: string;
	office: string;
	jobTitle: string;
	costCenter: string;
	department: string;
	manager: string;
	joinDate: string;
	pendingJoinDate: string;
	leaveDate: string;
	pendingLeaveDate: string;
	employmentStatus: EmploymentStatus;
};

type EmployeeRow = {
	id: string;
	legal_first_name: string;
	legal_last_name: string;
	other_legal_name: string;
	display_name: string;
	email: string;
	branch: string;
	office: string;
	job_title: string;
	cost_center: string | null;
	department: string;
	manager: string;
	join_date: string;
	pending_join_date: string;
	leave_date: string;
	pending_leave_date: string;
	employment_status: EmploymentStatus;
};

const employeeColumns = `
	id,
	legal_first_name,
	legal_last_name,
	other_legal_name,
	display_name,
	email,
	branch,
	office,
	job_title,
	cost_center,
	department,
	manager,
	join_date,
	pending_join_date,
	leave_date,
	pending_leave_date,
	employment_status
`;

const employmentStatuses: ReadonlySet<string> = new Set(["Active", "Onboarding", "Departing", "Inactive"]);

class ValidationError extends Error {}

function apiJson(value: unknown, status = 200): Response {
	return Response.json(value, {
		status,
		headers: {
			"Cache-Control": "private, no-store",
			"X-Content-Type-Options": "nosniff",
		},
	});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEmploymentStatus(value: string): value is EmploymentStatus {
	return employmentStatuses.has(value);
}

function rowToEmployee(row: EmployeeRow): Employee {
	return {
		id: row.id,
		legalFirstName: row.legal_first_name,
		legalLastName: row.legal_last_name,
		otherLegalName: row.other_legal_name,
		displayName: row.display_name,
		email: row.email,
		branch: row.branch,
		office: row.office,
		jobTitle: row.job_title,
		costCenter: row.cost_center ?? "",
		department: row.department,
		manager: row.manager,
		joinDate: row.join_date,
		pendingJoinDate: row.pending_join_date,
		leaveDate: row.leave_date,
		pendingLeaveDate: row.pending_leave_date,
		employmentStatus: row.employment_status,
	};
}

function textField(value: Record<string, unknown>, key: string, maxLength: number, required = false): string {
	const field = value[key];
	if (typeof field !== "string") {
		if (!required && field == null) return "";
		throw new ValidationError(`${key} must be text.`);
	}

	const normalized = field.trim();
	if (required && !normalized) throw new ValidationError(`${key} is required.`);
	if (normalized.length > maxLength) throw new ValidationError(`${key} is too long.`);
	return normalized;
}

function dateField(value: Record<string, unknown>, key: string): string {
	const field = textField(value, key, 10);
	if (!field) return "";
	if (!/^\d{4}-\d{2}-\d{2}$/.test(field)) throw new ValidationError(`${key} must use YYYY-MM-DD format.`);
	const parsed = new Date(`${field}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== field) {
		throw new ValidationError(`${key} must be a valid date.`);
	}
	return field;
}

function validateEmployee(value: unknown): Employee {
	if (!isRecord(value)) {
		throw new ValidationError("Employee data must be a JSON object.");
	}

	const id = textField(value, "id", 64, true);
	const email = textField(value, "email", 254);
	const employmentStatus = textField(value, "employmentStatus", 20, true);

	if (!/^[A-Za-z0-9._-]+$/.test(id)) {
		throw new ValidationError("id may contain only letters, numbers, dots, underscores, and hyphens.");
	}
	if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new ValidationError("email is not valid.");
	if (!isEmploymentStatus(employmentStatus)) throw new ValidationError("employmentStatus is not valid.");

	return {
		id,
		legalFirstName: textField(value, "legalFirstName", 120),
		legalLastName: textField(value, "legalLastName", 120),
		otherLegalName: textField(value, "otherLegalName", 240),
		displayName: textField(value, "displayName", 120, true),
		email,
		branch: textField(value, "branch", 120),
		office: textField(value, "office", 120),
		jobTitle: textField(value, "jobTitle", 160),
		costCenter: textField(value, "costCenter", 32),
		department: textField(value, "department", 120),
		manager: textField(value, "manager", 120),
		joinDate: dateField(value, "joinDate"),
		pendingJoinDate: dateField(value, "pendingJoinDate"),
		leaveDate: dateField(value, "leaveDate"),
		pendingLeaveDate: dateField(value, "pendingLeaveDate"),
		employmentStatus,
	};
}

async function parseEmployeeRequest(request: Request): Promise<Employee> {
	const contentLength = Number(request.headers.get("content-length") ?? 0);
	if (contentLength > 32_768) throw new ValidationError("Request body is too large.");

	let value: unknown;
	try {
		value = await request.json();
	} catch {
		throw new ValidationError("Request body must be valid JSON.");
	}
	return validateEmployee(value);
}

async function ensureCostCenter(db: D1Database, code: string): Promise<void> {
	if (!code) return;
	await db.prepare("INSERT INTO cost_centers (code) VALUES (?1) ON CONFLICT(code) DO NOTHING").bind(code).run();
}

async function readEmployee(db: D1Database, id: string): Promise<Employee | null> {
	const row = await db.prepare(`SELECT ${employeeColumns} FROM employees WHERE id = ?1`).bind(id).first<EmployeeRow>();
	return row ? rowToEmployee(row) : null;
}

function databaseErrorResponse(error: unknown, operation: string): Response {
	const message = error instanceof Error ? error.message : String(error);
	console.error(JSON.stringify({ message: "D1 employee operation failed", operation, error: message }));
	if (/UNIQUE constraint failed/i.test(message)) {
		return apiJson({ error: "conflict", message: "That employee ID or email address is already in use." }, 409);
	}
	return apiJson({ error: "database_error", message: "The employee database request failed." }, 500);
}

export async function handleEmployeesApi(request: Request, db: D1Database): Promise<Response | null> {
	const url = new URL(request.url);
	if (!url.pathname.startsWith("/api/employees")) return null;

	try {
		if (url.pathname === "/api/employees" && request.method === "GET") {
			const employeeResult = await db.prepare(`SELECT ${employeeColumns} FROM employees ORDER BY id`).all<EmployeeRow>();
			const costCenterResult = await db.prepare("SELECT code FROM cost_centers ORDER BY code").all<{ code: string }>();
			return apiJson({
				employees: employeeResult.results.map(rowToEmployee),
				costCenters: costCenterResult.results.map(({ code }) => code),
			});
		}

		if (url.pathname === "/api/employees" && request.method === "POST") {
			const employee = await parseEmployeeRequest(request);
			await ensureCostCenter(db, employee.costCenter);
			await db.prepare(`
				INSERT INTO employees (
					id, legal_first_name, legal_last_name, other_legal_name, display_name,
					email, branch, office, job_title, cost_center, department, manager,
					join_date, pending_join_date, leave_date, pending_leave_date, employment_status
				) VALUES (
					?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, NULLIF(?10, ''), ?11, ?12,
					?13, ?14, ?15, ?16, ?17
				)
			`).bind(
				employee.id, employee.legalFirstName, employee.legalLastName, employee.otherLegalName,
				employee.displayName, employee.email, employee.branch, employee.office, employee.jobTitle,
				employee.costCenter, employee.department, employee.manager, employee.joinDate,
				employee.pendingJoinDate, employee.leaveDate, employee.pendingLeaveDate, employee.employmentStatus,
			).run();
			return apiJson({ employee: await readEmployee(db, employee.id) }, 201);
		}

		const employeeMatch = url.pathname.match(/^\/api\/employees\/([^/]+)$/);
		if (employeeMatch && request.method === "PUT") {
			const currentId = decodeURIComponent(employeeMatch[1]);
			const employee = await parseEmployeeRequest(request);
			await ensureCostCenter(db, employee.costCenter);
			const result = await db.prepare(`
				UPDATE employees SET
					id = ?1, legal_first_name = ?2, legal_last_name = ?3, other_legal_name = ?4,
					display_name = ?5, email = ?6, branch = ?7, office = ?8, job_title = ?9,
					cost_center = NULLIF(?10, ''), department = ?11, manager = ?12, join_date = ?13,
					pending_join_date = ?14, leave_date = ?15, pending_leave_date = ?16,
					employment_status = ?17
				WHERE id = ?18
			`).bind(
				employee.id, employee.legalFirstName, employee.legalLastName, employee.otherLegalName,
				employee.displayName, employee.email, employee.branch, employee.office, employee.jobTitle,
				employee.costCenter, employee.department, employee.manager, employee.joinDate,
				employee.pendingJoinDate, employee.leaveDate, employee.pendingLeaveDate, employee.employmentStatus,
				currentId,
			).run();
			if (!result.meta.changes) {
				return apiJson({ error: "not_found", message: "Employee not found." }, 404);
			}
			return apiJson({ employee: await readEmployee(db, employee.id) });
		}

		return new Response(null, { status: 405, headers: { Allow: "GET, POST, PUT" } });
	} catch (error) {
		if (error instanceof ValidationError) {
			return apiJson({ error: "invalid_employee", message: error.message }, 400);
		}
		return databaseErrorResponse(error, `${request.method} ${url.pathname}`);
	}
}
