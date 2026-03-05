-- Migration 002: remove prompt note types to enforce freeform-only creation and storage
DELETE FROM notes WHERE note_type = 'prompt';
INSERT INTO schema_version (version) VALUES (2);
