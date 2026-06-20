import { getVersion, pool } from "../database/common.ts";
import type { QueryObject } from "../database/common.ts";
import {
  APP_FQDN,
  APP_SCHEME,
  CONTACT_EMAIL,
  LANG,
  WEEK_START,
} from "../../config.ts";

import { MAILER_FROM, MAILER_TRANSPORT_OPTIONS } from "../../config.mailer.ts";

// -----------------------------------------------------------------------------
// Migrate template.
// -----------------------------------------------------------------------------
async function migrateTo(upgradeTo: string, sqls: (string | QueryObject)[]) {
  const version = await getVersion();

  if (version < upgradeTo) {
    console.log(`Upgrade database to ${upgradeTo}`);

    using client = await pool.connect();
    const trans = client.createTransaction("transaction");
    await trans.begin();

    // run migration sqls
    for (const sql of sqls) {
      await trans.queryObject(sql);
    }

    // set the new version in metadata
    const versionSql = `
      UPDATE metadata
        SET mvalue='${upgradeTo}'
        WHERE mkey = 'database_version'`;
    await trans.queryObject(versionSql);

    await trans.commit();
    console.log(`Upgraded to database ${upgradeTo}`);
  }
}

// -----------------------------------------------------------------------------
async function migrateTo2024092201() {
  const upgradeTo = "20240922.01";
  const sqls = [
    `ALTER TABLE identity
       ADD COLUMN IF NOT EXISTS
         "seen_at" timestamp with time zone NOT NULL DEFAULT now()`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2024092801() {
  const upgradeTo = "20240928.01";
  const sqls = [
    `CREATE TYPE intercom_status_type AS ENUM (
       'none',
       'seen',
       'accepted',
       'rejected'
     )`,

    `CREATE TYPE intercom_message_type AS ENUM (
       'call',
       'alarm_for_meeting',
       'invite_for_domain',
       'invite_for_room',
       'invite_for_meeting',
       'request_for_meeting_membership'
     )`,

    `CREATE TABLE intercom (
       "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
       "identity_id" uuid NOT NULL REFERENCES identity(id) ON DELETE CASCADE,
       "remote_id" uuid NOT NULL REFERENCES identity(id) ON DELETE CASCADE,
       "status" intercom_status_type NOT NULL DEFAULT 'none',
       "message_type" intercom_message_type NOT NULL DEFAULT 'call',
       "intercom_attr" jsonb NOT NULL DEFAULT '{}'::jsonb,
       "created_at" timestamp with time zone NOT NULL DEFAULT now(),
       "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
       "expired_at" timestamp with time zone NOT NULL
           DEFAULT now() + interval '10 seconds'
     )`,

    `CREATE INDEX ON intercom("remote_id", "expired_at")`,

    `CREATE INDEX ON intercom("expired_at")`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2024101501() {
  const upgradeTo = "20241015.01";
  const sqls = [
    `CREATE TABLE contact_invite (
       "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
       "identity_id" uuid NOT NULL REFERENCES identity(id) ON DELETE CASCADE,
       "name" varchar(250) NOT NULL,
       "code" varchar(250) NOT NULL
           DEFAULT md5(random()::text) || md5(gen_random_uuid()::text),
       "disposable" boolean NOT NULL DEFAULT true,
       "enabled" boolean NOT NULL DEFAULT true,
       "created_at" timestamp with time zone NOT NULL DEFAULT now(),
       "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
       "expired_at" timestamp with time zone NOT NULL
           DEFAULT now() + interval '3 days'
     )`,

    `CREATE UNIQUE INDEX ON contact_invite("code")`,

    `CREATE INDEX ON contact_invite("identity_id", "expired_at")`,

    `CREATE INDEX ON contact_invite("expired_at")`,

    `CREATE INDEX ON meeting_request("expired_at")`,

    `CREATE INDEX ON meeting_session("ended_at")`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2024110301() {
  const upgradeTo = "20241103.01";
  const sqls = [
    `ALTER TABLE identity
       ADD COLUMN IF NOT EXISTS
         "identity_attr" jsonb NOT NULL DEFAULT '{}'::jsonb`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2024111601() {
  const upgradeTo = "20241116.01";
  const sqls = [
    `CREATE INDEX ON meeting_session("started_at")`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2024112301() {
  const upgradeTo = "20241123.01";
  const sqls = [
    `DROP TABLE intercom`,

    `DROP TYPE intercom_message_type`,

    `CREATE TYPE intercom_message_type AS ENUM (
       'call',
       'phone'
     )`,

    `CREATE TABLE intercom (
       "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
       "identity_id" uuid NOT NULL REFERENCES identity(id) ON DELETE CASCADE,
       "remote_id" uuid NOT NULL REFERENCES identity(id) ON DELETE CASCADE,
       "status" intercom_status_type NOT NULL DEFAULT 'none',
       "message_type" intercom_message_type NOT NULL DEFAULT 'call',
       "intercom_attr" jsonb NOT NULL DEFAULT '{}'::jsonb,
       "created_at" timestamp with time zone NOT NULL DEFAULT now(),
       "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
       "expired_at" timestamp with time zone NOT NULL
           DEFAULT now() + interval '10 seconds'
     )`,

    `CREATE INDEX ON intercom("remote_id", "expired_at")`,

    `CREATE INDEX ON intercom("expired_at")`,

    `CREATE TABLE phone (
       "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
       "identity_id" uuid NOT NULL REFERENCES identity(id) ON DELETE CASCADE,
       "profile_id" uuid REFERENCES profile(id) ON DELETE SET NULL,
       "domain_id" uuid NOT NULL REFERENCES domain(id) ON DELETE CASCADE,
       "name" varchar(250) NOT NULL,
       "code" varchar(250) NOT NULL
           DEFAULT md5(random()::text) || md5(gen_random_uuid()::text),
       "email_enabled" boolean NOT NULL DEFAULT true,
       "enabled" boolean NOT NULL DEFAULT true,
       "created_at" timestamp with time zone NOT NULL DEFAULT now(),
       "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
       "called_at" timestamp with time zone NOT NULL DEFAULT now(),
       "calls" integer NOT NULL DEFAULT 0
     )`,

    `CREATE UNIQUE INDEX ON phone("code")`,

    `CREATE INDEX ON phone("identity_id", "name")`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2024120701() {
  const upgradeTo = "20241207.01";
  const sqls = [
    `ALTER TABLE meeting
       ALTER COLUMN profile_id SET NOT NULL`,

    `ALTER TABLE meeting
       DROP CONSTRAINT "meeting_profile_id_fkey"`,

    `ALTER TABLE meeting
       ADD CONSTRAINT "meeting_profile_id_fkey"
       FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE NO ACTION
       NOT VALID`,

    `ALTER TABLE meeting
       VALIDATE CONSTRAINT "meeting_profile_id_fkey"`,

    `ALTER TABLE meeting_request
       ALTER COLUMN profile_id SET NOT NULL`,

    `ALTER TABLE meeting_request
       DROP CONSTRAINT "meeting_request_profile_id_fkey"`,

    `ALTER TABLE meeting_request
       ADD CONSTRAINT "meeting_request_profile_id_fkey"
       FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE NO ACTION
       NOT VALID`,

    `ALTER TABLE meeting_request
       VALIDATE CONSTRAINT "meeting_request_profile_id_fkey"`,

    `ALTER TABLE meeting_member
       ALTER COLUMN profile_id SET NOT NULL`,

    `ALTER TABLE meeting_member
       DROP CONSTRAINT "meeting_member_profile_id_fkey"`,

    `ALTER TABLE meeting_member
       ADD CONSTRAINT "meeting_member_profile_id_fkey"
       FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE NO ACTION
       NOT VALID`,

    `ALTER TABLE meeting_member
       VALIDATE CONSTRAINT "meeting_member_profile_id_fkey"`,

    `ALTER TABLE phone
       ALTER COLUMN profile_id SET NOT NULL`,

    `ALTER TABLE phone
       DROP CONSTRAINT "phone_profile_id_fkey"`,

    `ALTER TABLE phone
       ADD CONSTRAINT "phone_profile_id_fkey"
       FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE NO ACTION
       NOT VALID`,

    `ALTER TABLE phone
       VALIDATE CONSTRAINT "phone_profile_id_fkey"`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2024122201() {
  const upgradeTo = "20241222.01";
  const sqls = [
    `CREATE TABLE identity_key (
       "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
       "identity_id" uuid NOT NULL REFERENCES identity(id) ON DELETE CASCADE,
       "domain_id" uuid NOT NULL REFERENCES domain(id) ON DELETE CASCADE,
       "name" varchar(250) NOT NULL,
       "value" varchar(250) NOT NULL
         DEFAULT md5(random()::text) || md5(gen_random_uuid()::text),
       "enabled" boolean NOT NULL DEFAULT true,
       "created_at" timestamp with time zone NOT NULL DEFAULT now(),
       "updated_at" timestamp with time zone NOT NULL DEFAULT now()
     )`,

    `CREATE UNIQUE INDEX ON identity_key("value")`,

    `CREATE INDEX ON identity_key("identity_id", "name")`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2025030201() {
  const upgradeTo = "20250302.01";
  const sqls = [
    `ALTER TABLE contact
       ADD COLUMN IF NOT EXISTS
         "visible" boolean NOT NULL DEFAULT true`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2025080201() {
  const upgradeTo = "20250802.01";
  const sqls = [
    `DROP TABLE intercom`,

    `DROP TYPE intercom_message_type`,

    `CREATE TYPE intercom_message_type AS ENUM (
       'call',
       'phone',
       'text'
     )`,

    `CREATE TABLE intercom (
       "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
       "identity_id" uuid NOT NULL REFERENCES identity(id) ON DELETE CASCADE,
       "remote_id" uuid NOT NULL REFERENCES identity(id) ON DELETE CASCADE,
       "status" intercom_status_type NOT NULL DEFAULT 'none',
       "message_type" intercom_message_type NOT NULL DEFAULT 'call',
       "intercom_attr" jsonb NOT NULL DEFAULT '{}'::jsonb,
       "created_at" timestamp with time zone NOT NULL DEFAULT now(),
       "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
       "expired_at" timestamp with time zone NOT NULL
           DEFAULT now() + interval '10 seconds'
     )`,

    `CREATE INDEX ON intercom("remote_id", "expired_at")`,

    `CREATE INDEX ON intercom("expired_at")`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032101() {
  const upgradeTo = "20260321.01";
  const sqls = [
    `ALTER TABLE room
       ADD COLUMN IF NOT EXISTS
         "label" varchar(250) NOT NULL DEFAULT ''`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032102() {
  const upgradeTo = "20260321.02";
  const sqls = [
    `CREATE TABLE IF NOT EXISTS setting (
       "mkey" varchar(250) NOT NULL PRIMARY KEY,
       "mvalue" varchar(2000) NOT NULL DEFAULT ''
     )`,

    {
      text: `
        INSERT INTO setting (mkey, mvalue) VALUES
          ('contact_email', $1),
          ('app_fqdn', $2),
          ('app_scheme', $3),
          ('lang', $4),
          ('week_start', $5),
          ('mailer_host', $6),
          ('mailer_port', $7),
          ('mailer_secure', $8),
          ('mailer_user', $9),
          ('mailer_pass', $10),
          ('mailer_from', $11)
          ON CONFLICT (mkey) DO NOTHING`,
      args: [
        CONTACT_EMAIL,
        APP_FQDN,
        APP_SCHEME,
        LANG,
        String(WEEK_START),
        MAILER_TRANSPORT_OPTIONS.host,
        String(MAILER_TRANSPORT_OPTIONS.port),
        String(MAILER_TRANSPORT_OPTIONS.secure),
        MAILER_TRANSPORT_OPTIONS.auth.user,
        MAILER_TRANSPORT_OPTIONS.auth.pass,
        MAILER_FROM,
      ],
    },
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032103() {
  const upgradeTo = "20260321.03";
  const sqls = [
    `ALTER TABLE profile
       ADD COLUMN IF NOT EXISTS
         "avatar_url" varchar(500) NOT NULL DEFAULT ''`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032104() {
  const upgradeTo = "20260321.04";
  const sqls = [
    `DROP TABLE IF EXISTS meeting_member_candidate`,
    `DROP TABLE IF EXISTS meeting_member`,
    `DROP TABLE IF EXISTS contact_invite`,
    `DROP TABLE IF EXISTS contact`,
    `DROP TABLE IF EXISTS identity_key`,
    `DROP TABLE IF EXISTS phone`,
    `ALTER TABLE setting ALTER COLUMN mvalue TYPE text`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032201() {
  const upgradeTo = "20260322.01";
  const sqls = [
    `CREATE TABLE IF NOT EXISTS calendar_token (
       "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
       "identity_id" uuid NOT NULL UNIQUE REFERENCES identity(id) ON DELETE CASCADE,
       "token" varchar(250) NOT NULL UNIQUE
           DEFAULT md5(random()::text) || md5(random()::text),
       "enabled" boolean NOT NULL DEFAULT true,
       "created_at" timestamp with time zone NOT NULL DEFAULT now()
     )`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032202() {
  const upgradeTo = "20260322.02";
  const sqls = [
    `ALTER TABLE identity ADD COLUMN IF NOT EXISTS pref_lang varchar(10) DEFAULT NULL`,
    `ALTER TABLE identity ADD COLUMN IF NOT EXISTS pref_theme varchar(20) DEFAULT NULL`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032203() {
  const upgradeTo = "20260322.03";
  const sqls = [
    `ALTER TABLE identity
       ADD COLUMN IF NOT EXISTS
         "is_superadmin" boolean NOT NULL DEFAULT false`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032204() {
  const upgradeTo = "20260322.04";
  const sqls = [
    // Domains are now system-level resources, not owned by individual users.
    // Remove the per-user unique constraint and add a global unique on name.
    `DROP INDEX IF EXISTS domain_identity_id_name_idx`,
    `ALTER TABLE domain ADD CONSTRAINT domain_name_unique UNIQUE (name)`,

    // Set all existing domains to be owned by the system account.
    `UPDATE domain
       SET identity_id = '00000000-0000-0000-0000-000000000000'
       WHERE identity_id != '00000000-0000-0000-0000-000000000000'`,

    // Default new domains to the system account.
    `ALTER TABLE domain
       ALTER COLUMN identity_id
       SET DEFAULT '00000000-0000-0000-0000-000000000000'`,

    // New table for per-email domain access (alternative to public).
    `CREATE TABLE IF NOT EXISTS domain_member (
       "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
       "domain_id" uuid NOT NULL REFERENCES domain(id) ON DELETE CASCADE,
       "email" varchar(250) NOT NULL,
       "created_at" timestamp with time zone NOT NULL DEFAULT now()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS domain_member_domain_id_email_idx
       ON domain_member("domain_id", "email")`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032301() {
  const upgradeTo = "20260323.01";
  const sqls = [
    `ALTER TABLE meeting_schedule
       ADD COLUMN IF NOT EXISTS
         "host_key" varchar(8) NOT NULL
           DEFAULT substr(md5(gen_random_uuid()::text), 1, 8)`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032302() {
  const upgradeTo = "20260323.02";
  const sqls = [
    `CREATE OR REPLACE FUNCTION room_short_code() RETURNS text AS $$
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
     $$ LANGUAGE plpgsql`,
    `ALTER TABLE room
       ADD COLUMN IF NOT EXISTS short_code varchar(50) NOT NULL DEFAULT room_short_code()`,
    `CREATE UNIQUE INDEX IF NOT EXISTS room_short_code_idx ON room(short_code)`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032303() {
  const upgradeTo = "20260323.03";
  const sqls = [
    `DELETE FROM meeting WHERE schedule_type = 'permanent'`,
    `ALTER TABLE meeting
       ADD CONSTRAINT meeting_no_permanent
       CHECK (schedule_type != 'permanent')`,
    `ALTER TABLE meeting
       ALTER COLUMN schedule_type SET DEFAULT 'scheduled'`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032304() {
  const upgradeTo = "20260323.04";
  const sqls = [
    `DELETE FROM meeting WHERE schedule_type = 'ephemeral'`,
    `ALTER TABLE meeting DROP COLUMN IF EXISTS schedule_type`,
    `DROP TYPE IF EXISTS meeting_schedule_type`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032305() {
  const upgradeTo = "20260323.05";
  const sqls = [
    `ALTER TABLE meeting_schedule DROP COLUMN IF EXISTS name`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032501() {
  const upgradeTo = "20260325.01";
  const sqls = [
    `ALTER TABLE meeting DROP COLUMN IF EXISTS restricted`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032503() {
  const upgradeTo = "20260325.03";
  const sqls = [
    `ALTER TABLE room
       ADD COLUMN IF NOT EXISTS host_key varchar(9) NOT NULL
         DEFAULT substr(md5(gen_random_uuid()::text), 1, 9)`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026032502() {
  const upgradeTo = "20260325.02";
  const sqls = [
    `ALTER TABLE meeting_schedule
       ALTER COLUMN host_key TYPE varchar(9),
       ALTER COLUMN host_key SET DEFAULT substr(md5(gen_random_uuid()::text), 1, 9)`,
    `UPDATE meeting_schedule
       SET host_key = substr(md5(gen_random_uuid()::text), 1, 9)`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026061801() {
  const upgradeTo = "20260618.01";
  const sqls = [
    `CREATE TABLE IF NOT EXISTS identity_local (
       "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
       "identity_id" uuid NOT NULL REFERENCES identity(id) ON DELETE CASCADE,
       "email" varchar(250) NOT NULL,
       "password_hash" varchar(500) NOT NULL,
       "created_at" timestamp with time zone NOT NULL DEFAULT now(),
       "updated_at" timestamp with time zone NOT NULL DEFAULT now()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS identity_local_email_idx ON identity_local("email")`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026061802() {
  const upgradeTo = "20260618.02";
  const sqls = [
    // Create oidc_provider table
    `CREATE TABLE IF NOT EXISTS oidc_provider (
       "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
       "name" varchar(250) NOT NULL DEFAULT 'SSO',
       "issuer_url" varchar(500) NOT NULL,
       "client_id" varchar(250) NOT NULL,
       "client_secret" varchar(500) NOT NULL DEFAULT '',
       "scopes" varchar(250) NOT NULL DEFAULT 'openid profile email',
       "enabled" boolean NOT NULL DEFAULT true,
       "created_at" timestamp with time zone NOT NULL DEFAULT now(),
       "updated_at" timestamp with time zone NOT NULL DEFAULT now()
     )`,
    // Migrate existing OIDC config from setting table (if present and table exists)
    `DO $$
     BEGIN
       IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'setting') THEN
         INSERT INTO oidc_provider (name, issuer_url, client_id, client_secret, scopes)
         SELECT
           'SSO',
           (SELECT mvalue FROM setting WHERE mkey = 'oidc_issuer_url' LIMIT 1),
           (SELECT mvalue FROM setting WHERE mkey = 'oidc_client_id' LIMIT 1),
           COALESCE((SELECT mvalue FROM setting WHERE mkey = 'oidc_client_secret' LIMIT 1), ''),
           COALESCE((SELECT mvalue FROM setting WHERE mkey = 'oidc_scopes' LIMIT 1), 'openid profile email')
         WHERE
           (SELECT mvalue FROM setting WHERE mkey = 'oidc_issuer_url' LIMIT 1) IS NOT NULL
           AND (SELECT mvalue FROM setting WHERE mkey = 'oidc_issuer_url' LIMIT 1) != ''
           AND (SELECT mvalue FROM setting WHERE mkey = 'oidc_client_id' LIMIT 1) IS NOT NULL
           AND (SELECT mvalue FROM setting WHERE mkey = 'oidc_client_id' LIMIT 1) != '';
       END IF;
     END $$`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026061804() {
  const upgradeTo = "20260618.04";
  const sqls = [
    // Add is_superadmin column (was missing from initial schema — bypassed by
    // the '20260323.05' initial version that skipped earlier migrations)
    `ALTER TABLE identity ADD COLUMN IF NOT EXISTS
     "is_superadmin" boolean NOT NULL DEFAULT false`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
// Catch-all: fixes missing schema for DBs initialized with version 20260323.05
// that bypassed migrations 20260321.02 through 20260322.04.
async function migrateTo2026061805() {
  const upgradeTo = "20260618.05";
  const sqls = [
    // setting table (was in 20260321.02)
    `CREATE TABLE IF NOT EXISTS setting (
       "mkey" varchar(250) NOT NULL PRIMARY KEY,
       "mvalue" text NOT NULL DEFAULT ''
     )`,
    {
      text: `
        INSERT INTO setting (mkey, mvalue) VALUES
          ('contact_email', $1), ('app_fqdn', $2), ('app_scheme', $3),
          ('lang', $4), ('week_start', $5),
          ('mailer_host', $6), ('mailer_port', $7), ('mailer_secure', $8),
          ('mailer_user', $9), ('mailer_pass', $10), ('mailer_from', $11)
        ON CONFLICT (mkey) DO NOTHING`,
      args: [
        CONTACT_EMAIL,
        APP_FQDN,
        APP_SCHEME,
        LANG,
        String(WEEK_START),
        MAILER_TRANSPORT_OPTIONS.host,
        String(MAILER_TRANSPORT_OPTIONS.port),
        String(MAILER_TRANSPORT_OPTIONS.secure),
        MAILER_TRANSPORT_OPTIONS.auth.user,
        MAILER_TRANSPORT_OPTIONS.auth.pass,
        MAILER_FROM,
      ],
    },
    // calendar_token table (was in 20260322.01)
    `CREATE TABLE IF NOT EXISTS calendar_token (
       "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
       "identity_id" uuid NOT NULL UNIQUE REFERENCES identity(id) ON DELETE CASCADE,
       "token" varchar(250) NOT NULL UNIQUE
           DEFAULT md5(random()::text) || md5(random()::text),
       "enabled" boolean NOT NULL DEFAULT true,
       "created_at" timestamp with time zone NOT NULL DEFAULT now()
     )`,
    // pref_lang / pref_theme on identity (was in 20260322.02)
    `ALTER TABLE identity ADD COLUMN IF NOT EXISTS pref_lang varchar(10) DEFAULT NULL`,
    `ALTER TABLE identity ADD COLUMN IF NOT EXISTS pref_theme varchar(20) DEFAULT NULL`,
    // domain_member table (was in 20260322.04)
    `CREATE TABLE IF NOT EXISTS domain_member (
       "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
       "domain_id" uuid NOT NULL REFERENCES domain(id) ON DELETE CASCADE,
       "email" varchar(250) NOT NULL,
       "created_at" timestamp with time zone NOT NULL DEFAULT now()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS domain_member_domain_id_email_idx
       ON domain_member("domain_id", "email")`,
    // domain default identity_id = system account (was in 20260322.04)
    `ALTER TABLE domain
       ALTER COLUMN identity_id
       SET DEFAULT '00000000-0000-0000-0000-000000000000'`,
    // domain_name_unique constraint (was in 20260322.04)
    `DO $$ BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM information_schema.table_constraints
         WHERE table_name='domain' AND constraint_name='domain_name_unique'
       ) THEN
         ALTER TABLE domain ADD CONSTRAINT domain_name_unique UNIQUE (name);
       END IF;
     END $$`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
async function migrateTo2026061803() {
  const upgradeTo = "20260618.03";
  const sqls = [
    // Add avatar_url column to profile (required by profile.ts but missing from schema)
    `ALTER TABLE profile ADD COLUMN IF NOT EXISTS
     "avatar_url" varchar(500) NOT NULL DEFAULT ''`,
    // Add DEFAULT gen_random_uuid() to identity.id for future inserts
    `ALTER TABLE identity ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
  ];

  await migrateTo(upgradeTo, sqls);
}

// -----------------------------------------------------------------------------
export default async function runMigration() {
  console.log("migration...");

  const version = await getVersion();
  console.log(`Database version: ${version}`);

  await migrateTo2024092201();
  await migrateTo2024092801();
  await migrateTo2024101501();
  await migrateTo2024110301();
  await migrateTo2024111601();
  await migrateTo2024112301();
  await migrateTo2024120701();
  await migrateTo2024122201();
  await migrateTo2025030201();
  await migrateTo2025080201();
  await migrateTo2026032101();
  await migrateTo2026032102();
  await migrateTo2026032103();
  await migrateTo2026032104();
  await migrateTo2026032201();
  await migrateTo2026032202();
  await migrateTo2026032203();
  await migrateTo2026032204();
  await migrateTo2026032301();
  await migrateTo2026032302();
  await migrateTo2026032303();
  await migrateTo2026032304();
  await migrateTo2026032305();
  await migrateTo2026032501();
  await migrateTo2026032502();
  await migrateTo2026032503();
  await migrateTo2026061801();
  await migrateTo2026061802();
  await migrateTo2026061803();
  await migrateTo2026061804();
  await migrateTo2026061805();
}
