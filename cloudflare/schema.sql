CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  business TEXT DEFAULT '',
  service TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  appointment_time TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  meeting_url TEXT DEFAULT '',
  meeting_notes TEXT DEFAULT '',
  cancellation_reason TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  client_email TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clients (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  business TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_messages (
  id TEXT PRIMARY KEY,
  client_email TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT DEFAULT '',
  body_text TEXT DEFAULT '',
  body_html TEXT DEFAULT '',
  provider_id TEXT DEFAULT '',
  message_id TEXT DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS documents_client_idx ON documents(client_email);
CREATE INDEX IF NOT EXISTS email_messages_client_idx ON email_messages(client_email, created_at);
