import { Pool } from "@db/postgres";
import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  DB_HOST,
  DB_PASSWD,
  DB_PORT,
  DB_USER,
  DB_VERSION,
} from "../../../config.ts";

function databasePool(database: string): Pool {
  return new Pool(
    {
      user: DB_USER,
      password: DB_PASSWD,
      database,
      hostname: DB_HOST,
      port: DB_PORT,
    },
    1,
    true,
  );
}

async function createDatabase(database: string): Promise<void> {
  const admin = databasePool("postgres");
  try {
    using client = await admin.connect();
    await client.queryArray(`CREATE DATABASE ${database}`);
  } finally {
    await admin.end();
  }
}

async function dropDatabase(database: string): Promise<void> {
  const admin = databasePool("postgres");
  try {
    using client = await admin.connect();
    await client.queryArray(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`);
  } finally {
    await admin.end();
  }
}

async function initializeBaseSchema(database: string): Promise<Pool> {
  const setup = databasePool(database);
  const schema = await Deno.readTextFile(
    new URL("../../../database/02-create-jitsi-tables.sql", import.meta.url),
  );
  using client = await setup.connect();
  await client.queryArray(schema);
  return setup;
}

async function runMigrations(database: string): Promise<void> {
  const command = new Deno.Command(Deno.execPath(), {
    cwd: Deno.cwd(),
    args: ["run", "--allow-all", "test/migrate.ts"],
    env: {
      DB_NAME: database,
      DB_USER,
      DB_PASSWD,
      DB_HOST,
      DB_PORT: String(DB_PORT),
      API_SECRET: "migration-upgrade-test-secret",
    },
    stdout: "piped",
    stderr: "piped",
  });
  const output = await command.output();
  assertEquals(
    output.success,
    true,
    new TextDecoder().decode(output.stderr),
  );
}

describe(
  "historical database upgrade",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    it("preserves meeting membership while upgrading from 20260321.03", async () => {
      const database = `jitsi_upgrade_${
        crypto.randomUUID().replaceAll("-", "")
      }`;
      await createDatabase(database);

      try {
        const setup = await initializeBaseSchema(database);
        try {
          using client = await setup.connect();
          await client.queryArray(`
            CREATE TABLE setting (
              mkey varchar(250) PRIMARY KEY,
              mvalue varchar(2000) NOT NULL DEFAULT ''
            );
            CREATE TYPE meeting_schedule_type AS ENUM (
              'permanent', 'scheduled', 'ephemeral'
            );
            ALTER TABLE meeting ADD COLUMN schedule_type meeting_schedule_type
              NOT NULL DEFAULT 'scheduled';
            UPDATE metadata SET mvalue='20260321.03'
              WHERE mkey='database_version';

            INSERT INTO identity (id) VALUES
              ('10000000-0000-0000-0000-000000000001');
            INSERT INTO profile (id, identity_id, name, email, is_default)
              VALUES (
                '20000000-0000-0000-0000-000000000001',
                '10000000-0000-0000-0000-000000000001',
                'Upgrade user', 'upgrade@example.com', true
              );
            INSERT INTO room (id, identity_id, domain_id, name)
              SELECT
                '30000000-0000-0000-0000-000000000001',
                '10000000-0000-0000-0000-000000000001', id,
                'upgrade-room'
              FROM domain WHERE name='meet.jit.si';
            INSERT INTO meeting (id, identity_id, profile_id, room_id, name)
              VALUES (
                '40000000-0000-0000-0000-000000000001',
                '10000000-0000-0000-0000-000000000001',
                '20000000-0000-0000-0000-000000000001',
                '30000000-0000-0000-0000-000000000001',
                'Upgrade meeting'
              );
            INSERT INTO meeting_member (identity_id, meeting_id, profile_id)
              VALUES (
                '10000000-0000-0000-0000-000000000001',
                '40000000-0000-0000-0000-000000000001',
                '20000000-0000-0000-0000-000000000001'
              );
            INSERT INTO meeting_member_candidate (identity_id, meeting_id)
              VALUES (
                '10000000-0000-0000-0000-000000000001',
                '40000000-0000-0000-0000-000000000001'
              );
          `);
        } finally {
          await setup.end();
        }

        await runMigrations(database);

        const verify = databasePool(database);
        try {
          using client = await verify.connect();
          const result = await client.queryObject<
            Record<string, boolean | string>
          >(`
            SELECT
              (SELECT mvalue FROM metadata WHERE mkey='database_version') AS version,
              (SELECT count(*)::text FROM meeting_member) AS meeting_member,
              (SELECT count(*)::text FROM meeting_member_candidate) AS candidate,
              to_regclass('contact') IS NULL AS contact_removed,
              to_regclass('intercom') IS NULL AS intercom_removed
          `);
          assertEquals(result.rows[0], {
            version: DB_VERSION,
            meeting_member: "1",
            candidate: "1",
            contact_removed: true,
            intercom_removed: true,
          });
        } finally {
          await verify.end();
        }
      } finally {
        await dropDatabase(database);
      }
    });

    it("repairs membership tables and scheduling state after the old migration", async () => {
      const database = `jitsi_repair_${
        crypto.randomUUID().replaceAll("-", "")
      }`;
      await createDatabase(database);
      try {
        const setup = await initializeBaseSchema(database);
        try {
          using client = await setup.connect();
          await client.queryArray(`
            DROP TABLE meeting_member_candidate, meeting_member;
            UPDATE metadata SET mvalue='20260622.01'
              WHERE mkey='database_version';
          `);
        } finally {
          await setup.end();
        }

        await runMigrations(database);

        const verify = databasePool(database);
        try {
          using client = await verify.connect();
          const result = await client.queryObject<
            Record<string, boolean | string>
          >(`
            SELECT
              (SELECT mvalue FROM metadata WHERE mkey='database_version') AS version,
              to_regclass('meeting_member') IS NOT NULL AS meeting_member,
              to_regclass('meeting_member_candidate') IS NOT NULL AS candidate,
              EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='meeting_session'
                  AND column_name='reminder_sent_at'
              ) AS reminder_state,
              to_regclass('meeting_session_schedule_started_at_idx')
                IS NOT NULL AS unique_session_index,
              to_regclass('phone') IS NULL AS phone_removed
          `);
          assertEquals(result.rows[0], {
            version: DB_VERSION,
            meeting_member: true,
            candidate: true,
            reminder_state: true,
            unique_session_index: true,
            phone_removed: true,
          });
        } finally {
          await verify.end();
        }
      } finally {
        await dropDatabase(database);
      }
    });
  },
);
