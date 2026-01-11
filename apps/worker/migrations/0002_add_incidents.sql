CREATE TABLE IF NOT EXISTS incident_rooms (
  incident_key TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(room_id) REFERENCES rooms(id)
);

CREATE INDEX IF NOT EXISTS idx_incident_rooms_room
  ON incident_rooms(room_id);
