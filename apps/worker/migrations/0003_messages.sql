CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  author_display_name TEXT NOT NULL,
  FOREIGN KEY(room_id) REFERENCES rooms(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_room_created
  ON messages(room_id, created_at);
