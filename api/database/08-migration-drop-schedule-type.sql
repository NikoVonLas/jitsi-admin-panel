-- Migration: drop schedule_type column from meeting (only 'scheduled' remains)
-- Run once against an existing database:
--   docker exec -i <db-container> psql -U jitsi -d jitsi < 08-migration-drop-schedule-type.sql

DO $$
DECLARE
  _version varchar := '20260323.04';
BEGIN
  IF (SELECT mvalue FROM metadata WHERE mkey = 'database_version') >= _version THEN
    RAISE NOTICE 'migration % already applied, skipping', _version;
    RETURN;
  END IF;

  -- drop leftover ephemeral meetings (legacy, nothing creates them anymore)
  DELETE FROM meeting WHERE schedule_type = 'ephemeral';

  -- drop the column and its enum type
  ALTER TABLE meeting DROP COLUMN schedule_type;
  DROP TYPE IF EXISTS meeting_schedule_type;

  UPDATE metadata SET mvalue = _version WHERE mkey = 'database_version';
END $$;
