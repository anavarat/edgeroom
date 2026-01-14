ALTER TABLE incident_rooms ADD COLUMN status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE incident_rooms ADD COLUMN resolved_at TEXT;
