CREATE TABLE IF NOT EXISTS cost_centers (code TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  legal_first_name TEXT NOT NULL DEFAULT '',
  legal_last_name TEXT NOT NULL DEFAULT '',
  other_legal_name TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  branch TEXT NOT NULL DEFAULT '',
  office TEXT NOT NULL DEFAULT '',
  job_title TEXT NOT NULL DEFAULT '',
  cost_center TEXT REFERENCES cost_centers(code),
  department TEXT NOT NULL DEFAULT '',
  manager TEXT NOT NULL DEFAULT '',
  join_date TEXT NOT NULL DEFAULT '',
  pending_join_date TEXT NOT NULL DEFAULT '',
  leave_date TEXT NOT NULL DEFAULT '',
  pending_leave_date TEXT NOT NULL DEFAULT '',
  employment_status TEXT NOT NULL DEFAULT 'Active'
);
INSERT OR IGNORE INTO cost_centers(code) VALUES ('ENG'), ('PEOPLE');
INSERT OR IGNORE INTO employees(id, display_name, email, office, job_title, department, manager, join_date, employment_status)
VALUES
  ('DEMO-001', 'Alex Lee', 'alex@example.test', 'Shanghai', 'Product designer', 'Design', 'Morgan Yu', '2025-02-01', 'Active'),
  ('DEMO-002', 'Morgan Yu', 'morgan@example.test', 'Shanghai', 'Design lead', 'Design', '', '2024-06-10', 'Active'),
  ('DEMO-003', 'Jamie Chen', 'jamie@example.test', 'Singapore', 'People partner', 'People', '', '2026-10-05', 'Onboarding'),
  ('DEMO-004', 'Taylor Park', 'taylor@example.test', 'London', 'Software engineer', 'Engineering', '', '2023-03-14', 'Departing');
