ALTER TABLE meeting_schedule
  ALTER COLUMN host_key TYPE varchar(9),
  ALTER COLUMN host_key SET DEFAULT substr(md5(gen_random_uuid()::text), 1, 9);

UPDATE meeting_schedule
SET host_key = substr(md5(gen_random_uuid()::text), 1, 9);
