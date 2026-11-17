CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  details TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  source_title TEXT,
  published_at TEXT,
  discovered_at TEXT NOT NULL,
  relevance INTEGER NOT NULL DEFAULT 3,
  impact TEXT NOT NULL DEFAULT 'Medium',
  effort TEXT NOT NULL DEFAULT 'Medium',
  risks TEXT NOT NULL DEFAULT '',
  confidence INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'NEW',
  decision_note TEXT NOT NULL DEFAULT '',
  content_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
CREATE INDEX IF NOT EXISTS idx_findings_discovered ON findings(discovered_at DESC);
CREATE TABLE IF NOT EXISTS research_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  sources_checked INTEGER NOT NULL DEFAULT 0,
  items_seen INTEGER NOT NULL DEFAULT 0,
  findings_added INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT ''
);
