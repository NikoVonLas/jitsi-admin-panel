-- Migration: remove permanent meetings
-- Run once against an existing database:
--   docker exec -i <db-container> psql -U jitsi -d jitsi < 07-migration-drop-permanent-meetings.sql

DO $$
DECLARE
  _version varchar := '20260323.03';
BEGIN
  -- run only if not applied yet
  IF (SELECT mvalue FROM metadata WHERE mkey = 'database_version') >= _version THEN
    RAISE NOTICE 'migration % already applied, skipping', _version;
    RETURN;
  END IF;

  -- delete all permanent meetings (cascade removes schedules, sessions, etc.)
  DELETE FROM meeting WHERE schedule_type = 'permanent';

  -- prevent new permanent meetings
  ALTER TABLE meeting
    ADD CONSTRAINT meeting_no_permanent
    CHECK (schedule_type != 'permanent');

  -- new meetings default to scheduled
  ALTER TABLE meeting
    ALTER COLUMN schedule_type SET DEFAULT 'scheduled';

  UPDATE metadata SET mvalue = _version WHERE mkey = 'database_version';
END $$;
