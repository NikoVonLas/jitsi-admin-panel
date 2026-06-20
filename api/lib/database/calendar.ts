import { fetch } from "./common.ts";
import {
  dateAfterXDays,
  getFirstDayOfMonth,
  getFirstDayOfWeek,
} from "../common/helper.ts";
import type { MeetingSchedule222 } from "./types.ts";

// -----------------------------------------------------------------------------
export async function listSessionForIcal(
  identityId: string,
  limit: number,
  offset: number,
): Promise<MeetingSchedule222[]> {
  const sql = {
    text: `
      SELECT DISTINCT ON (started_at, meeting_id)
        meeting_id, meeting_name, meeting_info, started_at,
        ended_at, duration, waiting_time, join_as, membership_id
      FROM (
        SELECT m.id as meeting_id, m.id, m.name as meeting_name,
          m.info as meeting_info, ses.started_at,
          ses.ended_at, ses.duration, 0 as waiting_time, 'host' as join_as,
          null as membership_id, 0 as priority
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
        WHERE m.identity_id = $1
          AND m.enabled
          AND r.identity_id = $1
          AND (d.public OR d.identity_id = r.identity_id)
          AND ses.started_at > now() - interval '30 days'
          AND ses.started_at < now() + interval '365 days'

        ORDER BY started_at, meeting_id, priority
      ) AS combined
      ORDER BY started_at
      LIMIT $2 OFFSET $3`,
    args: [identityId, limit, offset],
  };

  return await fetch(sql) as MeetingSchedule222[];
}

// -----------------------------------------------------------------------------
export async function listSessionByMonth(
  identityId: string,
  date: string,
  limit: number,
  offset: number,
) {
  // First, find the first day of the month then find the first day of the week
  // which this day belongs to. Don't use this day as the beginning of the
  // period because dates in databases are in UTC but UI may use a different
  // time zone. So, take one day earlier as the beginning of the period.
  //
  // There are 6 weeks (42 days) in UI. So the range should be at least 44 days
  // because of possible zone differences.
  //
  // UI will filter out the date which are not in UI time zone.
  const firstOfMonth = getFirstDayOfMonth(date);
  const firstOfWeek = getFirstDayOfWeek(firstOfMonth);
  const firstDay = dateAfterXDays(firstOfWeek, -1);
  const lastDay = dateAfterXDays(firstDay, 44);

  const sql = {
    text: `
      SELECT DISTINCT ON (started_at, meeting_id)
        meeting_id, meeting_name, meeting_info, started_at,
        ended_at, duration, waiting_time, join_as, membership_id
      FROM (
        SELECT m.id as meeting_id, m.id, m.name as meeting_name,
          m.info as meeting_info, ses.started_at,
          ses.ended_at, ses.duration, 0 as waiting_time, 'host' as join_as,
          null as membership_id, 0 as priority
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
        WHERE m.identity_id = $1
          AND m.enabled
          AND r.identity_id = $1
          AND (d.public OR d.identity_id = r.identity_id)
          AND ses.started_at > $2
          AND ses.started_at < $3

        ORDER BY started_at, meeting_id, priority
      ) AS combined
      ORDER BY started_at
      LIMIT $4 OFFSET $5`,
    args: [
      identityId,
      firstDay,
      lastDay,
      limit,
      offset,
    ],
  };

  return await fetch(sql) as MeetingSchedule222[];
}
