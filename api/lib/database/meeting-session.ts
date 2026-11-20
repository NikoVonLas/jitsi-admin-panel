import { organizerHasRoom } from "./room-access.ts";
import { HttpError } from "../http/error.ts";
import { Transaction } from "@db/postgres";
import { checkAttr, fetch } from "./common.ts";
import type { Attr, MeetingSessionForReminder } from "./types.ts";

// -----------------------------------------------------------------------------
function isOver(date: string, minutes: number) {
  const now = new Date();
  const time = new Date(date);
  const epoch = time.getTime() + minutes * 60 * 1000;

  return now.getTime() > epoch;
}

// -----------------------------------------------------------------------------
function checkScheduleAttrOnce(scheduleAttr: Attr) {
  if (Number(scheduleAttr.duration) < 1) {
    throw new Error("duration is out of range");
  }
  if (Number(scheduleAttr.duration) > 1440) {
    throw new Error("duration is out of range");
  }
  if (
    !scheduleAttr.timezone &&
    isOver(scheduleAttr.started_at, Number(scheduleAttr.duration))
  ) {
    throw new Error("it is already over");
  }
}

// -----------------------------------------------------------------------------
function checkScheduleAttrDaily(scheduleAttr: Attr) {
  if (Number(scheduleAttr.duration) < 1) {
    throw new Error("duration is out of range");
  }
  if (Number(scheduleAttr.duration) > 1440) {
    throw new Error("duration is out of range");
  }
  if (
    scheduleAttr.rep_end_type !== "x" && scheduleAttr.rep_end_type !== "forever"
  ) {
    throw new Error("wrong rep_end_type");
  }
  if (scheduleAttr.rep_end_type === "x") {
    if (Number(scheduleAttr.rep_end_x) < 1) {
      throw new Error("times is out of range");
    }
    if (
      !scheduleAttr.timezone && isOver(
        scheduleAttr.started_at,
        (Number(scheduleAttr.rep_end_x) - 1) * Number(scheduleAttr.rep_every) *
            24 * 60 + Number(scheduleAttr.duration),
      )
    ) {
      throw new Error("it is already over");
    }
  }
  if (Number(scheduleAttr.rep_every) < 1) {
    throw new Error("rep_every is out of range");
  }
}

// -----------------------------------------------------------------------------
function checkScheduleAttrWeekly(scheduleAttr: Attr) {
  if (Number(scheduleAttr.duration) < 1) {
    throw new Error("duration is out of range");
  }
  if (Number(scheduleAttr.duration) > 1440) {
    throw new Error("duration is out of range");
  }
  if (scheduleAttr.rep_end_type !== "at") {
    throw new Error("wrong rep_end_type");
  }
  if (!/^[01]{7}$/.exec(scheduleAttr.rep_days)) {
    throw new Error("wrong rep_days");
  }
  if (Number(scheduleAttr.rep_every) < 1) {
    throw new Error("rep_every is out of range");
  }
  if (
    Date.parse(scheduleAttr.started_at) > Date.parse(scheduleAttr.rep_end_at)
  ) {
    throw new Error("invalid period");
  }
  if (isOver(scheduleAttr.rep_end_at, 0)) {
    throw new Error("it is already over");
  }
}

// -----------------------------------------------------------------------------
function checkScheduleAttrMonthly(scheduleAttr: Attr) {
  if (
    Number(scheduleAttr.duration) < 1 || Number(scheduleAttr.duration) > 1440
  ) {
    throw new Error("duration is out of range");
  }
  if (scheduleAttr.rep_end_type !== "at") throw new Error("wrong rep_end_type");
  if (Number(scheduleAttr.rep_every) < 1) {
    throw new Error("rep_every is out of range");
  }
  if (
    Date.parse(scheduleAttr.started_at) > Date.parse(scheduleAttr.rep_end_at)
  ) {
    throw new Error("invalid period");
  }
  if (isOver(scheduleAttr.rep_end_at, 0)) throw new Error("it is already over");
  if (scheduleAttr.rep_month_mode === "d") {
    const day = Number(scheduleAttr.rep_month_day);
    if (day < 1 || day > 31) throw new Error("rep_month_day is out of range");
  } else if (scheduleAttr.rep_month_mode === "w") {
    const pos = Number(scheduleAttr.rep_month_pos);
    if (![-2, -1, 1, 2, 3, 4, 5].includes(pos)) {
      throw new Error("rep_month_pos is invalid");
    }
    const dow = Number(scheduleAttr.rep_month_dow);
    if (dow < 0 || dow > 6) {
      throw new Error("rep_month_dow is out of range");
    }
  } else {
    throw new Error("unknown rep_month_mode");
  }
}

// -----------------------------------------------------------------------------
export function validateSchedule(attr: Attr) {
  try {
    checkAttr(attr);
    checkScheduleAttr(attr);
    if (!Number.isFinite(Date.parse(attr.started_at))) {
      throw new Error("Invalid date");
    }
    if (
      attr.rep_end_type === "at" &&
      !Number.isFinite(Date.parse(attr.rep_end_at))
    ) throw new Error("Invalid end date");
    for (
      const key of [
        "duration",
        "rep_every",
        "rep_end_x",
        "rep_month_day",
        "rep_month_dow",
        "rep_month_pos",
        "timezone_offset",
      ]
    ) {
      if (attr[key] && !Number.isSafeInteger(Number(attr[key]))) {
        throw new Error("Invalid schedule number");
      }
    }
    if (attr.timezone) {
      new Intl.DateTimeFormat("en", { timeZone: attr.timezone });
    }
  } catch {
    throw new HttpError(400, "Invalid meeting schedule");
  }
}

export function checkScheduleAttr(scheduleAttr: Attr) {
  if (scheduleAttr.type === "o") {
    checkScheduleAttrOnce(scheduleAttr);
  } else if (scheduleAttr.type === "d") {
    checkScheduleAttrDaily(scheduleAttr);
  } else if (scheduleAttr.type === "w") {
    checkScheduleAttrWeekly(scheduleAttr);
  } else if (scheduleAttr.type === "m") {
    checkScheduleAttrMonthly(scheduleAttr);
  } else {
    throw new Error("Unknow schedule type");
  }
}

// -----------------------------------------------------------------------------
// Generate candidate dates in the organizer's civil calendar, then convert each
// occurrence to an instant. Legacy rules contain a JS offset (minutes west of
// UTC), which is also the sign convention for PostgreSQL's POSIX zone names.
const occurrenceSql = `
  , rules AS (
    SELECT id, refill, schedule_attr AS a,
      (schedule_attr->>'started_at')::timestamptz AS origin,
      (schedule_attr->>'duration')::int AS minutes,
      coalesce((schedule_attr->>'rep_every')::int, 1) AS stride,
      coalesce(nullif(schedule_attr->>'timezone', ''), format('UTC%s%s:%s',
        CASE WHEN utc_offset < 0 THEN '-' ELSE '+' END,
        abs(utc_offset) / 60, lpad((abs(utc_offset) % 60)::text, 2, '0'))) AS zone
    FROM selected
    CROSS JOIN LATERAL (SELECT coalesce((schedule_attr->>'timezone_offset')::int,0) AS utc_offset) legacy
  ), local_rules AS (
    SELECT *, origin AT TIME ZONE zone AS local_start,
      CASE a->>'rep_end_type'
        WHEN 'at' THEN (a->>'rep_end_at')::timestamptz
        WHEN 'forever' THEN (CASE WHEN refill THEN now() ELSE greatest(origin,now()) END) + interval '365 days'
      END AS until
    FROM rules
  ), bounds AS (
    SELECT *, CASE WHEN until IS NOT NULL THEN (until AT TIME ZONE zone)::date
      WHEN a->>'type' = 'd' THEN local_start::date + ((a->>'rep_end_x')::int - 1) * stride
      ELSE local_start::date END AS last_day
    FROM local_rules
  ), calendar_days AS (
    SELECT b.*, day::date AS day,
      (date_trunc('month',day) + interval '1 month - 1 day')::date AS month_end
    FROM bounds b
    CROSS JOIN LATERAL generate_series(
      greatest(local_start::date, (now() AT TIME ZONE zone)::date - 2)::timestamp,
      last_day::timestamp, interval '1 day') day
  ), occurrences AS (
    SELECT *, CASE WHEN day = local_start::date THEN origin
      ELSE (day + local_start::time) AT TIME ZONE zone END AS instant
    FROM calendar_days
    WHERE CASE a->>'type'
      WHEN 'o' THEN day = local_start::date
      WHEN 'd' THEN (day - local_start::date) % stride = 0
      WHEN 'w' THEN ((day - local_start::date + extract(dow FROM local_start)::int) / 7) % stride = 0
        AND substring(a->>'rep_days',extract(dow FROM day)::int + 1,1) = '1'
      WHEN 'm' THEN ((extract(year FROM day)::int - extract(year FROM local_start)::int) * 12
        + extract(month FROM day)::int - extract(month FROM local_start)::int) % stride = 0
        AND CASE a->>'rep_month_mode'
          WHEN 'd' THEN extract(day FROM day) = least((a->>'rep_month_day')::int,extract(day FROM month_end))
          WHEN 'w' THEN extract(dow FROM day) = (a->>'rep_month_dow')::int
            AND (a->>'rep_month_pos')::int IN ((extract(day FROM day)::int - 1) / 7 + 1, -1 - (month_end - day) / 7)
        END
    END
  ), sessions AS (
    SELECT *, CASE WHEN minutes = 1440 AND local_start::time = time '00:00'
      THEN (day + 1)::timestamp AT TIME ZONE zone
      ELSE instant + make_interval(mins => minutes) END AS finish
    FROM occurrences
  )
  INSERT INTO meeting_session (meeting_schedule_id, started_at, duration, ended_at)
  SELECT id, instant, (extract(epoch FROM finish - instant) / 60)::int, finish
  FROM sessions
  WHERE (until IS NULL OR instant <= until) AND finish > now()
  ON CONFLICT (meeting_schedule_id, started_at) DO NOTHING
  RETURNING id, created_at AS at`;

export async function addMeetingSession(
  trans: Transaction,
  meetingScheduleId: string,
) {
  const result = await trans.queryObject({
    text:
      `WITH selected AS (SELECT id,schedule_attr,false AS refill FROM meeting_schedule WHERE id=$1) ${occurrenceSql}`,
    args: [meetingScheduleId],
  });
  if (!result.rows.length) {
    throw new HttpError(400, "Schedule has no upcoming sessions");
  }
}

export async function delMeetingSessionBySchedule(
  trans: Transaction,
  meetingScheduleId: string,
) {
  const sql = {
    text: `
      DELETE FROM meeting_session
      WHERE meeting_schedule_id = $1
      RETURNING id, created_at as at`,
    args: [
      meetingScheduleId,
    ],
  };

  await trans.queryObject(sql);
}

// -----------------------------------------------------------------------------
export async function listMeetingSessionForReminder() {
  const limit = 1000;

  const sql = {
    text: `
      SELECT m.id, ses.id as session_id, i3.identity_attr->>'email' as email,
        m.name as meeting_name, ses.started_at
      FROM meeting m
        JOIN room r ON m.room_id = r.id
                       AND r.enabled
        JOIN domain d ON r.domain_id = d.id
                         AND d.enabled
        JOIN identity i1 ON d.identity_id = i1.id
                            AND i1.enabled
        JOIN identity i2 ON r.identity_id = i2.id
                            AND i2.enabled
        JOIN identity i3 ON m.identity_id = i3.id
                            AND i3.enabled
        JOIN meeting_schedule s ON m.id = s.meeting_id
                                   AND s.enabled
        JOIN meeting_session ses ON s.id = ses.meeting_schedule_id
      WHERE ${organizerHasRoom}
        AND ses.reminder_sent_at IS NULL
        AND ses.started_at > now() + interval '25 minutes'
        AND ses.started_at < now() + interval '31 minutes'
        AND m.enabled
      ORDER BY ses.started_at, ses.id
      LIMIT $1`,
    args: [limit],
  };

  return await fetch(sql) as MeetingSessionForReminder[];
}

// -----------------------------------------------------------------------------
export async function markMeetingSessionReminderSent(sessionId: string) {
  const sql = {
    text: `
      UPDATE meeting_session
      SET reminder_sent_at = now(), updated_at = now()
      WHERE id = $1
        AND reminder_sent_at IS NULL
      RETURNING id, reminder_sent_at as at`,
    args: [sessionId],
  };

  return await fetch(sql) as { id: string; at: string }[];
}

// -----------------------------------------------------------------------------
// Keep a one-year rolling horizon for daily schedules that have no end date.
// The unique index added by the migration makes this safe to run repeatedly.
export async function ensureForeverMeetingSessions() {
  const sql = {
    text: `
      WITH selected AS (
        SELECT id, schedule_attr,true AS refill FROM meeting_schedule
        WHERE enabled AND schedule_attr->>'type'='d'
          AND schedule_attr->>'rep_end_type'='forever'
          AND schedule_attr->>'started_at' IS NOT NULL
          AND schedule_attr->>'duration' ~ '^[0-9]+$'
          AND schedule_attr->>'rep_every' ~ '^[0-9]+$'
          AND (schedule_attr->>'duration')::integer BETWEEN 1 AND 1440
          AND (schedule_attr->>'rep_every')::integer >= 1
      ) ${occurrenceSql}`,
    args: [],
  };

  return await fetch(sql) as { id: string; at: string }[];
}
