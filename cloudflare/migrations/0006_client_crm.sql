CREATE TABLE IF NOT EXISTS tax_tasks (
  id TEXT PRIMARY KEY,
  client_email TEXT NOT NULL,
  tax_year TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'requested',
  due_date TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS tax_tasks_client_idx ON tax_tasks(client_email, tax_year);
