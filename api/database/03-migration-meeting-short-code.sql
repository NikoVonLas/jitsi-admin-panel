-- Migration: add short_code to meeting table
-- Run once against an existing database:
--   docker exec -i <db-container> psql -U jitsi -d jitsi < 03-migration-meeting-short-code.sql

CREATE OR REPLACE FUNCTION meeting_short_code() RETURNS text AS $$
DECLARE
  adj  text[] := ARRAY['swift','calm','bold','warm','clear','deep','fine','glad','kind','neat',
                        'rare','soft','wise','cool','dark','fair','firm','free','full','keen',
                        'lean','mild','new','odd','old','pure','rich','safe','true','wild',
                        'bright','clean','crisp','eager','fresh','light','lush','open','proud','sharp',
                        'sleek','slim','smart','still','strong','sure','tall','thin','tight','young'];
  noun text[] := ARRAY['moon','star','wave','leaf','snow','rain','wind','fire','lake','peak',
                        'reef','seed','tide','vine','dawn','dusk','mist','moss','oak','pine',
                        'fog','dew','hill','pond','pool','rose','sage','sun','sky','stone',
                        'fern','gust','haze','iris','isle','knoll','log','orb','path','rock',
                        'rill','root','rush','sand','slope','stem','vale','brook','grove','creek'];
  num  integer;
BEGIN
  num := 10 + floor(random() * 90)::integer;
  RETURN adj[1 + floor(random() * array_length(adj, 1))::int] || '-' ||
         noun[1 + floor(random() * array_length(noun, 1))::int] || '-' ||
         num::text;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE meeting
  ADD COLUMN IF NOT EXISTS short_code varchar(50) NOT NULL DEFAULT meeting_short_code();

CREATE UNIQUE INDEX IF NOT EXISTS meeting_short_code_idx ON meeting(short_code);
