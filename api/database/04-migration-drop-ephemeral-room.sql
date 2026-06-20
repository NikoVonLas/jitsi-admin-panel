-- Migration: remove the ephemeral room concept.
-- All rooms are now static (user-created). Ephemeral rooms that exist in the
-- database were auto-created and are no longer needed; their meetings are
-- deleted via CASCADE.

DELETE FROM room WHERE ephemeral = true;
ALTER TABLE room DROP COLUMN IF EXISTS ephemeral;
