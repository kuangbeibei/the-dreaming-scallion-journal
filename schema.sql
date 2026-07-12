CREATE TABLE IF NOT EXISTS journal (
  id         TEXT PRIMARY KEY,      -- fixed slug; single-user app uses 'me'
  doc        TEXT NOT NULL,         -- JSON string of { pages, sections, bookmark, soundOn }
  updated_at INTEGER NOT NULL       -- epoch ms of the last write (last-write-wins)
);
