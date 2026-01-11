CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  author_user_id TEXT,
  author_display_name TEXT,
  FOREIGN KEY(room_id) REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  assignee TEXT,
  created_by_user_id TEXT,
  created_by_display_name TEXT,
  FOREIGN KEY(room_id) REFERENCES rooms(id)
);

CREATE INDEX IF NOT EXISTS idx_events_room_created
  ON events(room_id, created_at);

CREATE INDEX IF NOT EXISTS idx_tasks_room
  ON tasks(room_id);
