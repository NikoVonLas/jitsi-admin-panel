import { Transaction } from "@db/postgres";
import { fetch } from "./common.ts";
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
  if (isOver(scheduleAttr.started_at, Number(scheduleAttr.duration))) {
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
      isOver(
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
  if (scheduleAttr.started_at > scheduleAttr.rep_end_at) {
    throw new Error("invalid period");
  }
  if (isOver(scheduleAttr.rep_end_at, 0)) {
    throw new Error("it is already over");
  }
}

// -----------------------------------------------------------------------------
// For the client perspective (timezone), the session start date in the first
// day of the week (Sunday) to which the given date is belong. The value of
// timezoneOffset is a negative number for UTC- zones.
//
// The date argument is a date in UTC zone. So, check the timezone offset to
// correct it.
// -----------------------------------------------------------------------------
function getFirstDateOfInterval(date: Date, timezoneOffset: number) {
  const diffBefore = date.getHours() * 60 + date.getMinutes();
  const diffAfter = (24 * 60) - diffBefore;

  if ((diffAfter + timezoneOffset) <= 0) {
    return new Date(date.getTime() - (date.getDay() + 1) * 24 * 60 * 60 * 1000);
  } else if ((diffBefore - timezoneOffset) < 0) {
    return new Date(date.getTime() - (date.getDay() - 1) * 24 * 60 * 60 * 1000);
  } else {
    return new Date(date.getTime() - date.getDay() * 24 * 60 * 60 * 1000);
  }
}

// -----------------------------------------------------------------------------
function getNthWeekdayOfMonth(
  year: number,
  month: number,
  dow: number,
  pos: number,
): number | null {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  if (pos > 0) {
    const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const dayNum = 1 + (dow - firstDow + 7) % 7 + (pos - 1) * 7;
    if (dayNum > daysInMonth) return null;
    return dayNum;
  } else {
    // pos = -1 (last) or -2 (penultimate)
    const lastDow = new Date(Date.UTC(year, month, daysInMonth)).getUTCDay();
    const dayNum = daysInMonth - (lastDow - dow + 7) % 7 + (pos + 1) * 7;
    if (dayNum < 1) return null;
    return dayNum;
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
  if (scheduleAttr.started_at > scheduleAttr.rep_end_at) {
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
// The structure of scheduleAttr must be checked before calling this function.
// -----------------------------------------------------------------------------
async function addMeetingSessionOnce(
  trans: Transaction,
  meetingScheduleId: string,
  scheduleAttr: Attr,
) {
  const sql = {
    text: `
      INSERT INTO meeting_session (meeting_schedule_id, started_at, duration,
        ended_at)
      VALUES ($1, $2, $3,
        $2::timestamptz + $3::integer * interval '1 min')
      RETURNING id, created_at as at`,
    args: [
      meetingScheduleId,
      scheduleAttr.started_at,
      scheduleAttr.duration,
    ],
  };

  await trans.queryObject(sql);
}

// -----------------------------------------------------------------------------
// The structure of scheduleAttr must be checked before calling this function.
// -----------------------------------------------------------------------------
async function addMeetingSessionDaily(
  trans: Transaction,
  meetingScheduleId: string,
  scheduleAttr: Attr,
) {
  const now = new Date();
  const started_at = new Date(scheduleAttr.started_at);
  let counter = 0;

  const totalTimes = scheduleAttr.rep_end_type === "forever"
    ? Math.ceil(
      365 * 24 * 60 * 60 * 1000 /
        (Number(scheduleAttr.rep_every) * 24 * 60 * 60 * 1000),
    ) + 1
    : Number(scheduleAttr.rep_end_x);

  for (let i = 0; i < totalTimes; i++) {
    const session_start = started_at.getTime() +
      i * Number(scheduleAttr.rep_every) * 24 * 60 * 60 * 1000;
    const session_end = session_start +
      Number(scheduleAttr.duration) * 60 * 1000;

    // if this session is already over, skip it
    if (now.getTime() > session_end) continue;

    const at = new Date(session_start);
    const sql = {
      text: `
        INSERT INTO meeting_session (meeting_schedule_id, started_at, duration,
          ended_at)
        VALUES ($1, $2, $3,
          $2::timestamptz + $3::integer * interval '1 min')
        RETURNING id, created_at as at`,
      args: [
        meetingScheduleId,
        at.toISOString(),
        scheduleAttr.duration,
      ],
    };

    await trans.queryObject(sql);
    counter = counter + 1;
  }

  if (counter === 0) throw new Error("no inserted session");
}

// -----------------------------------------------------------------------------
// The structure of scheduleAttr must be checked before calling this function.
// -----------------------------------------------------------------------------
async function addMeetingSessionWeekly(
  trans: Transaction,
  meetingScheduleId: string,
  scheduleAttr: Attr,
) {
  const now = new Date();
  const started_at = new Date(scheduleAttr.started_at);
  const ended_at = new Date(scheduleAttr.rep_end_at);
  const timezoneOffset = Number(scheduleAttr.timezone_offset);
  const firstDateOfInterval = getFirstDateOfInterval(
    started_at,
    timezoneOffset,
  );
  let counter = 0;

  // loop in days of week (from Sunday (0) to Saturday (6))
  for (let i = 0; i < 7; i++) {
    // if this is not a selected day, skip it
    if (scheduleAttr.rep_days[i] !== "1") continue;

    let session_start = firstDateOfInterval.getTime() + i * 24 * 60 * 60 * 1000;
    while (session_start < ended_at.getTime()) {
      const at = new Date(session_start);
      const sql = {
        text: `
          INSERT INTO meeting_session (meeting_schedule_id, started_at,
            duration, ended_at)
          VALUES ($1, $2, $3,
            $2::timestamptz + $3::integer * interval '1 min')
          RETURNING id, created_at as at`,
        args: [
          meetingScheduleId,
          at.toISOString(),
          scheduleAttr.duration,
        ],
      };

      const session_end = session_start +
        Number(scheduleAttr.duration) * 60 * 1000;
      if (
        started_at.getTime() <= session_start &&
        now.getTime() < session_end
      ) {
        await trans.queryObject(sql);
        counter = counter + 1;
      }

      // jump to the next week depending on the repeat interval (every)
      session_start = session_start +
        Number(scheduleAttr.rep_every) * 7 * 24 * 60 * 60 * 1000;
    }
  }

  if (counter === 0) throw new Error("no inserted session");
}

// -----------------------------------------------------------------------------
function resolveMonthlyDayNum(
  scheduleAttr: Attr,
  year: number,
  month: number,
): number | null {
  if (scheduleAttr.rep_month_mode === "d") {
    const targetDay = Number(scheduleAttr.rep_month_day);
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Math.min(targetDay, daysInMonth);
  }
  return getNthWeekdayOfMonth(
    year,
    month,
    Number(scheduleAttr.rep_month_dow),
    Number(scheduleAttr.rep_month_pos),
  );
}

// -----------------------------------------------------------------------------
async function insertMonthlySession(
  trans: Transaction,
  meetingScheduleId: string,
  scheduleAttr: Attr,
  sessionUTC: Date,
  started_at: Date,
  ended_at: Date,
  now: Date,
): Promise<boolean> {
  if (sessionUTC >= ended_at) return false;

  const sessionEnd = sessionUTC.getTime() +
    Number(scheduleAttr.duration) * 60 * 1000;

  if (sessionUTC >= started_at && now.getTime() < sessionEnd) {
    const sql = {
      text: `
        INSERT INTO meeting_session (meeting_schedule_id, started_at,
          duration, ended_at)
        VALUES ($1, $2, $3,
          $2::timestamptz + $3::integer * interval '1 min')
        RETURNING id, created_at as at`,
      args: [
        meetingScheduleId,
        sessionUTC.toISOString(),
        scheduleAttr.duration,
      ],
    };
    await trans.queryObject(sql);
    return true;
  }
  return false;
}

// -----------------------------------------------------------------------------
// The structure of scheduleAttr must be checked before calling this function.
// -----------------------------------------------------------------------------
async function addMeetingSessionMonthly(
  trans: Transaction,
  meetingScheduleId: string,
  scheduleAttr: Attr,
) {
  const now = new Date();
  const started_at = new Date(scheduleAttr.started_at);
  const ended_at = new Date(scheduleAttr.rep_end_at);
  const timezoneOffset = Number(scheduleAttr.timezone_offset);
  const repEvery = Number(scheduleAttr.rep_every);

  // Derive local time-of-day from the UTC started_at
  const localStart = new Date(
    started_at.getTime() - timezoneOffset * 60 * 1000,
  );
  const localHours = localStart.getUTCHours();
  const localMinutes = localStart.getUTCMinutes();
  let year = localStart.getUTCFullYear();
  let month = localStart.getUTCMonth(); // 0-indexed

  let counter = 0;

  for (let iteration = 0; iteration < 500; iteration++) {
    const dayNum = resolveMonthlyDayNum(scheduleAttr, year, month);

    if (dayNum !== null) {
      const sessionLocalMs = Date.UTC(
        year,
        month,
        dayNum,
        localHours,
        localMinutes,
      );
      const sessionUTC = new Date(sessionLocalMs + timezoneOffset * 60 * 1000);

      if (sessionUTC >= ended_at) break;

      const inserted = await insertMonthlySession(
        trans,
        meetingScheduleId,
        scheduleAttr,
        sessionUTC,
        started_at,
        ended_at,
        now,
      );
      if (inserted) counter++;
    }

    month += repEvery;
    while (month >= 12) {
      month -= 12;
      year++;
    }
  }

  if (counter === 0) throw new Error("no inserted session");
}

// -----------------------------------------------------------------------------
// The structure of scheduleAttr must be checked before calling this function.
// -----------------------------------------------------------------------------
export async function addMeetingSession(
  trans: Transaction,
  meetingScheduleId: string,
  scheduleAttr: Attr,
) {
  if (scheduleAttr.type === "o") {
    await addMeetingSessionOnce(trans, meetingScheduleId, scheduleAttr);
  } else if (scheduleAttr.type === "d") {
    await addMeetingSessionDaily(trans, meetingScheduleId, scheduleAttr);
  } else if (scheduleAttr.type === "w") {
    await addMeetingSessionWeekly(trans, meetingScheduleId, scheduleAttr);
  } else if (scheduleAttr.type === "m") {
    await addMeetingSessionMonthly(trans, meetingScheduleId, scheduleAttr);
  } else {
    throw new Error("Unknow schedule type");
  }
}

// -----------------------------------------------------------------------------
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
export async function listMeetingSessionForReminder(lastCheckTime: string) {
  // The limit should be higher than the number of expected participants in a
  // minute, otherwise lastCheckTime will be skipped before fetching all records
  // for this period.
  const limit = 1000;

  // id should be the membership id for members.
  // id should be the meeting id for the owner.
  const sql = {
    text: `
      SELECT m.id, 'owner' as role, i3.identity_attr->>'email' as email,
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
      WHERE ses.started_at > $1
        AND ses.started_at > now() + interval '25 minutes'
        AND ses.started_at < now() + interval '31 minutes'
        AND m.enabled

      LIMIT $2`,
    args: [
      lastCheckTime,
      limit,
    ],
  };

  return await fetch(sql) as MeetingSessionForReminder[];
}
