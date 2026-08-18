import { query } from "../database/common.ts";
import { ensureForeverMeetingSessions } from "../database/meeting-session.ts";

// -----------------------------------------------------------------------------
async function execute(sql: string) {
  const sqlObject = { text: sql };

  try {
    await query(sqlObject);
  } catch (e) {
    console.error(e);
  }
}

// -----------------------------------------------------------------------------
async function delMeetingRequest() {
  const sql = `
    DELETE FROM meeting_request
    WHERE expired_at < now()
  `;
  await execute(sql);
}

// -----------------------------------------------------------------------------
async function delMeetingSession() {
  const sql = `
    DELETE FROM meeting_session
    WHERE ended_at + interval '20 mins' < now()
  `;
  await execute(sql);
}

// -----------------------------------------------------------------------------
async function delMeetingSchedule() {
  const sql = `
    DELETE FROM meeting_schedule s
    WHERE updated_at + interval '10 mins' < now()
      AND NOT EXISTS (SELECT 1
                      FROM meeting_session
                      WHERE meeting_schedule_id = s.id
                     )
  `;
  await execute(sql);
}

// -----------------------------------------------------------------------------
export default async function runHousekeeping() {
  console.log("housekeeping...");

  await ensureForeverMeetingSessions();
  await delMeetingRequest();
  await delMeetingSession();
  await delMeetingSchedule();
}
