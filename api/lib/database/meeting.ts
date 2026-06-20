import { fetch } from "./common.ts";
import type {
  Id,
  Meeting,
  Meeting000,
  Meeting222,
  MeetingLinkset,
} from "./types.ts";

// -----------------------------------------------------------------------------
export interface MeetingListResult {
  items: Meeting222[];
  total: number;
}

// -----------------------------------------------------------------------------
export interface ListMeetingOptions {
  identityId: string;
  isSuperAdmin: boolean;
  limit: number;
  offset: number;
  search: string;
  enabled: boolean | null;
  hasSession: boolean | null;
  roomId: string | null;
  domainId: string | null;
  ownerIdentityId?: string | null;
  sessionDate?: string | null;
}

// -----------------------------------------------------------------------------
export interface AddMeetingOptions {
  identityId: string;
  profileId: string;
  roomId: string;
  name: string;
  info: string;
  hidden: boolean;
  subscribable: boolean;
  isSuperAdmin?: boolean;
}

// -----------------------------------------------------------------------------
export interface UpdateMeetingOptions {
  identityId: string;
  meetingId: string;
  profileId: string;
  roomId: string;
  name: string;
  info: string;
  hidden: boolean;
  subscribable: boolean;
  isSuperAdmin?: boolean;
}

// -----------------------------------------------------------------------------
export async function getMeeting(
  identityId: string,
  meetingId: string,
  isSuperAdmin = false,
) {
  const sql = {
    text: `
      SELECT m.id, m.name, m.info, pr.id as profile_id, pr.name as profile_name,
        pr.email as profile_email, d.id as domain_id, d.name as domain_name,
        (CASE d.auth_type
           WHEN 'jaas' THEN d.domain_attr->>'jaas_url'
           ELSE d.domain_attr->>'url'
         END
        ) as domain_url,
        d.enabled as domain_enabled, r.id as room_id, r.name as room_name,
        r.enabled as room_enabled,
        m.hidden, m.subscribable, m.enabled,
        m.created_at, m.updated_at
      FROM meeting m
        JOIN room r ON m.room_id = r.id
        JOIN domain d ON r.domain_id = d.id
        LEFT JOIN profile pr ON m.profile_id = pr.id
      WHERE m.id = $2
        AND ($3 OR m.identity_id = $1)`,
    args: [
      identityId,
      meetingId,
      isSuperAdmin,
    ],
  };

  return await fetch(sql) as Meeting[];
}

// -----------------------------------------------------------------------------
// consumer is public
// -----------------------------------------------------------------------------

// WARNING: add status checks
// WARNING: is id needed? Check in the context of secrity

export async function getPublicMeeting(meetingId: string) {
  const sql = {
    text: `
      SELECT id, name, info, subscribable
      FROM meeting
      WHERE id = $1
        AND NOT hidden`,
    args: [
      meetingId,
    ],
  };

  return await fetch(sql) as Meeting000[];
}

// -----------------------------------------------------------------------------
// For the moderator join page — returns name and short_code regardless of hidden.
// -----------------------------------------------------------------------------
export async function getMeetingForMod(meetingId: string) {
  const sql = {
    text: `
      SELECT id, name, short_code
      FROM meeting
      WHERE id = $1
        AND enabled`,
    args: [meetingId],
  };

  return await fetch(sql) as { id: string; name: string; short_code: string }[];
}

// -----------------------------------------------------------------------------
// consumer is owner but object isn't sent to the client side.
// -----------------------------------------------------------------------------
export async function getMeetingLinkset(
  identityId: string,
  meetingId: string,
  isSuperAdmin = false,
) {
  const sql = {
    text: `
      SELECT m.id, m.name, r.name as room_name, '' as schedule_name,
        r.has_suffix, r.suffix, d.auth_type, d.domain_attr, 'host' as join_as,
        ses.started_at, ses.ended_at, ses.duration,
        extract('epoch' from age(ses.ended_at, now()))::integer as remaining,
        pr.name as profile_name, pr.email as profile_email,
        pr.avatar_url as profile_avatar_url
      FROM meeting m
        JOIN room r ON m.room_id = r.id
                       AND r.enabled
        JOIN domain d ON r.domain_id = d.id
                         AND d.enabled
        JOIN identity i1 ON d.identity_id = i1.id
                            AND i1.enabled
        JOIN identity i2 ON r.identity_id = i2.id
                            AND i2.enabled
        LEFT JOIN meeting_schedule s ON m.id = s.meeting_id
                                        AND s.enabled
        LEFT JOIN meeting_session ses ON s.id = ses.meeting_schedule_id
        LEFT JOIN profile pr ON m.profile_id = pr.id
      WHERE m.id = $2
        AND ($3 OR m.identity_id = $1)
        AND ($3 OR r.identity_id = $1)
        AND (d.public OR d.identity_id = r.identity_id)
        AND ses.ended_at > now()
      ORDER BY ses.started_at
      LIMIT 1
        `,
    args: [
      identityId,
      meetingId,
      isSuperAdmin,
    ],
  };

  const linkset = await fetch(sql) as MeetingLinkset[];
  await updateMeetingRoomSuffix(linkset[0].id);
  await updateMeetingRoomAccessTime(linkset[0].id);
  await updateMeetingAccessTime(linkset[0].id);

  return await fetch(sql) as MeetingLinkset[];
}

// -----------------------------------------------------------------------------
// consumer is public audience via short link (no invite required)
// -----------------------------------------------------------------------------
export async function getMeetingLinksetByShortCode(shortCode: string) {
  const sql = {
    text: `
      SELECT m.id, m.name, r.name as room_name, '' as schedule_name,
        r.has_suffix, r.suffix, d.auth_type, d.domain_attr, 'guest' as join_as,
        ses.started_at, ses.ended_at, ses.duration,
        extract('epoch' from age(ses.ended_at, now()))::integer as remaining,
        '' as profile_name, '' as profile_email, '' as profile_avatar_url
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
        LEFT JOIN meeting_schedule s ON m.id = s.meeting_id
                                        AND s.enabled
        LEFT JOIN meeting_session ses ON s.id = ses.meeting_schedule_id
      WHERE m.short_code = $1
        AND m.enabled
        AND ses.ended_at > now()
      ORDER BY ses.started_at
      LIMIT 1`,
    args: [shortCode],
  };

  const linkset = await fetch(sql) as MeetingLinkset[];
  if (linkset[0]) {
    await updateMeetingRoomSuffix(linkset[0].id);
    await updateMeetingRoomAccessTime(linkset[0].id);
    await updateMeetingAccessTime(linkset[0].id);
  }

  return linkset;
}

// -----------------------------------------------------------------------------
export async function getMeeting222ById(
  identityId: string,
  meetingId: string,
  isSuperAdmin = false,
) {
  const sql = {
    text: `
      SELECT m.id, m.name, m.short_code, m.info, pr.name as profile_name, pr.email as profile_email,
        d.name as domain_name,
        (CASE d.auth_type
           WHEN 'jaas' THEN d.domain_attr->>'jaas_url'
           ELSE d.domain_attr->>'url'
         END
        ) as domain_url,
        r.name as room_name,
        array(SELECT started_at
              FROM meeting_session
              WHERE meeting_schedule_id IN (
                  SELECT id FROM meeting_schedule
                  WHERE meeting_id = m.id AND enabled
                )
                AND ended_at > now()
              ORDER BY started_at
             ) as session_list,
        (SELECT min(started_at)
         FROM meeting_session
         WHERE meeting_schedule_id IN (
             SELECT id FROM meeting_schedule
             WHERE meeting_id = m.id AND enabled
           )
           AND ended_at > now()
        ) as session_at,
        m.hidden, m.subscribable, m.enabled,
        (r.enabled AND i2.enabled AND d.enabled AND i1.enabled
         AND (r.identity_id = $1 OR $3)
         AND (d.identity_id = r.identity_id OR d.public)
        ) as chain_enabled, m.updated_at, 'owner' as ownership,
        m.id as membership_id, 'host' as join_as
      FROM meeting m
        JOIN profile pr ON m.profile_id = pr.id
        JOIN room r ON m.room_id = r.id
        JOIN domain d ON r.domain_id = d.id
        JOIN identity i1 ON d.identity_id = i1.id
        JOIN identity i2 ON r.identity_id = i2.id
      WHERE ($3 OR m.identity_id = $1)
        AND m.id = $2`,
    args: [identityId, meetingId, isSuperAdmin],
  };

  return await fetch(sql) as Meeting222[];
}

// -----------------------------------------------------------------------------
export async function listMeeting(
  opts: ListMeetingOptions,
): Promise<MeetingListResult> {
  const {
    identityId,
    isSuperAdmin,
    limit,
    offset,
    search,
    enabled,
    hasSession,
    roomId,
    domainId,
    ownerIdentityId = null,
    sessionDate = null,
  } = opts;
  const searchPattern = search ? `%${search}%` : null;

  const itemSql = {
    text: `
      SELECT m.id, m.name, m.short_code, m.info, pr.name as profile_name, pr.email as profile_email, d.name as domain_name,
        (CASE d.auth_type
           WHEN 'jaas' THEN d.domain_attr->>'jaas_url'
           ELSE d.domain_attr->>'url'
         END
        ) as domain_url,
        r.name as room_name,
        array(SELECT started_at
              FROM meeting_session
              WHERE meeting_schedule_id IN (
                  SELECT id
                  FROM meeting_schedule
                  WHERE meeting_id = m.id
                    AND enabled
                )
                AND ended_at > now()
              ORDER BY started_at
             ) as session_list,
        (SELECT min(started_at)
         FROM meeting_session
         WHERE meeting_schedule_id IN (
             SELECT id
             FROM meeting_schedule
             WHERE meeting_id = m.id
               AND enabled
           )
           AND ended_at > now()
        ) as session_at,
        m.hidden, m.subscribable, m.enabled,
        (r.enabled AND i2.enabled
         AND d.enabled AND i1.enabled
         AND (r.identity_id = $1 OR $4)
         AND (d.identity_id = r.identity_id OR d.public)
        ) as chain_enabled, m.updated_at, 'owner' as ownership,
        m.id as membership_id, 'host' as join_as
      FROM meeting m
        JOIN profile pr ON m.profile_id = pr.id
        JOIN room r ON m.room_id = r.id
        JOIN domain d ON r.domain_id = d.id
        JOIN identity i1 ON d.identity_id = i1.id
        JOIN identity i2 ON r.identity_id = i2.id
      WHERE ($4 OR m.identity_id = $1)
        AND ($5::text IS NULL OR (m.name ILIKE $5 OR m.info ILIKE $5 OR r.name ILIKE $5 OR r.label ILIKE $5 OR d.name ILIKE $5 OR pr.email ILIKE $5))
        AND ($6::boolean IS NULL OR m.enabled = $6)
        AND ($7::boolean IS NULL OR (
          EXISTS (
            SELECT 1 FROM meeting_session ms2
            JOIN meeting_schedule ms3 ON ms2.meeting_schedule_id = ms3.id
            WHERE ms3.meeting_id = m.id AND ms3.enabled AND ms2.ended_at > now()
          )
        ) = $7)
        AND ($8::uuid IS NULL OR m.room_id = $8::uuid)
        AND ($9::uuid IS NULL OR d.id = $9::uuid)
        AND ($10::uuid IS NULL OR m.identity_id = $10::uuid)
        AND ($11::date IS NULL OR EXISTS (
          SELECT 1 FROM meeting_session ms2
          JOIN meeting_schedule ms3 ON ms2.meeting_schedule_id = ms3.id
          WHERE ms3.meeting_id = m.id AND ms3.enabled
            AND ms2.started_at::date = $11::date
        ))
      ORDER BY session_at, name
      LIMIT $2 OFFSET $3`,
    args: [
      identityId,
      limit,
      offset,
      isSuperAdmin,
      searchPattern,
      enabled,
      hasSession,
      roomId,
      domainId,
      ownerIdentityId,
      sessionDate,
    ],
  };

  const countSql = {
    text: `
      SELECT count(*) as total
      FROM meeting m
        JOIN room r ON m.room_id = r.id
        JOIN domain d ON r.domain_id = d.id
        JOIN identity i1 ON d.identity_id = i1.id
        JOIN identity i2 ON r.identity_id = i2.id
        LEFT JOIN profile pr ON m.profile_id = pr.id
      WHERE ($1 OR m.identity_id = $2)
        AND ($3::text IS NULL OR (m.name ILIKE $3 OR m.info ILIKE $3 OR r.name ILIKE $3 OR r.label ILIKE $3 OR d.name ILIKE $3 OR pr.email ILIKE $3))
        AND ($4::boolean IS NULL OR m.enabled = $4)
        AND ($5::boolean IS NULL OR (
          EXISTS (
            SELECT 1 FROM meeting_session ms2
            JOIN meeting_schedule ms3 ON ms2.meeting_schedule_id = ms3.id
            WHERE ms3.meeting_id = m.id AND ms3.enabled AND ms2.ended_at > now()
          )
        ) = $5)
        AND ($6::uuid IS NULL OR m.room_id = $6::uuid)
        AND ($7::uuid IS NULL OR d.id = $7::uuid)
        AND ($8::uuid IS NULL OR m.identity_id = $8::uuid)
        AND ($9::date IS NULL OR EXISTS (
          SELECT 1 FROM meeting_session ms2
          JOIN meeting_schedule ms3 ON ms2.meeting_schedule_id = ms3.id
          WHERE ms3.meeting_id = m.id AND ms3.enabled
            AND ms2.started_at::date = $9::date
        ))`,
    args: [
      isSuperAdmin,
      identityId,
      searchPattern,
      enabled,
      hasSession,
      roomId,
      domainId,
      ownerIdentityId,
      sessionDate,
    ],
  };

  const [items, countRows] = await Promise.all([
    fetch(itemSql) as Promise<Meeting222[]>,
    fetch(countSql) as Promise<{ total: string }[]>,
  ]);

  return { items, total: Number(countRows[0].total) };
}

// -----------------------------------------------------------------------------
// consumer is public
// -----------------------------------------------------------------------------

// WARNING: add partnership status too
// WARNING: is id needed? Check in the context of secrity

export async function listPublicMeeting(
  limit: number,
  offset: number,
) {
  const sql = {
    text: `
      SELECT m.id, m.name, m.info, m.subscribable
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
      WHERE NOT m.hidden
        AND m.enabled
      ORDER BY m.created_at DESC
      LIMIT $1 OFFSET $2`,
    args: [
      limit,
      offset,
    ],
  };

  return await fetch(sql) as Meeting000[];
}

// -----------------------------------------------------------------------------
export async function addMeeting(opts: AddMeetingOptions) {
  const {
    identityId,
    profileId,
    roomId,
    name,
    info,
    hidden,
    subscribable,
    isSuperAdmin = false,
  } = opts;

  const sql = {
    text: `
      INSERT INTO meeting (identity_id, profile_id, room_id, name, info,
        hidden, subscribable)
      VALUES (
        $1,
        (SELECT id
         FROM profile
         WHERE id = $2
           AND ($8 OR identity_id = $1)
        ),
        (SELECT id
         FROM room
         WHERE id = $3
           AND ($8 OR identity_id = $1)
        ),
        $4, $5, $6, $7)
      RETURNING id, created_at as at`,
    args: [
      identityId,
      profileId,
      roomId,
      name,
      info,
      hidden,
      subscribable,
      isSuperAdmin,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function delMeeting(
  identityId: string,
  meetingId: string,
  isSuperAdmin = false,
) {
  const sql = {
    text: `
      DELETE FROM meeting
      WHERE id = $2
        AND ($3 OR identity_id = $1)
      RETURNING id, now() as at`,
    args: [
      identityId,
      meetingId,
      isSuperAdmin,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function updateMeeting(opts: UpdateMeetingOptions) {
  const {
    identityId,
    meetingId,
    profileId,
    roomId,
    name,
    info,
    hidden,
    subscribable,
    isSuperAdmin = false,
  } = opts;

  const sql = {
    text: `
      UPDATE meeting
      SET
        profile_id= (SELECT id
                     FROM profile
                     WHERE id = $3
                       AND ($9 OR identity_id = $1)
                    ),
        room_id = (SELECT id
                   FROM room
                   WHERE id = $4
                     AND ($9 OR identity_id = $1)
                  ),
        name = $5,
        info = $6,
        hidden = $7,
        subscribable = $8,
        updated_at = now()
      WHERE id = $2
        AND ($9 OR identity_id = $1)
      RETURNING id, updated_at as at`,
    args: [
      identityId,
      meetingId,
      profileId,
      roomId,
      name,
      info,
      hidden,
      subscribable,
      isSuperAdmin,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function updateMeetingEnabled(
  identityId: string,
  meetingId: string,
  value: boolean,
  isSuperAdmin = false,
) {
  const sql = {
    text: `
      UPDATE meeting
      SET
        enabled = $3,
        updated_at = now()
      WHERE id = $2
        AND ($4 OR identity_id = $1)
      RETURNING id, updated_at as at`,
    args: [
      identityId,
      meetingId,
      value,
      isSuperAdmin,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function updateMeetingRoomSuffix(meetingId: string) {
  const sql = {
    text: `
      UPDATE room
      SET
        suffix = DEFAULT
      WHERE id = (SELECT room_id
                  FROM meeting
                  WHERE id = $1
                 )
        AND has_suffix
        AND accessed_at + interval '4 hours' < now()
      RETURNING id, accessed_at as at`,
    args: [
      meetingId,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function updateMeetingRoomAccessTime(meetingId: string) {
  const sql = {
    text: `
      UPDATE room
      SET
        accessed_at = now(),
        attendance = attendance + 1
      WHERE id = (SELECT room_id
                  FROM meeting
                  WHERE id = $1
                 )
      RETURNING id, accessed_at as at`,
    args: [
      meetingId,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function updateMeetingAccessTime(meetingId: string) {
  const sql = {
    text: `
      UPDATE meeting
      SET
        accessed_at = now(),
        attendance = attendance + 1
      WHERE id = $1
      RETURNING id, accessed_at as at`,
    args: [
      meetingId,
    ],
  };

  return await fetch(sql) as Id[];
}
