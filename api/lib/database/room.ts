import { fetch } from "./common.ts";
import { generateRoomUrl } from "../common/helper.ts";
import { getDefaultProfile, getDefaultProfileByKey } from "./profile.ts";
import type {
  Affiliation,
  Id,
  RandomRoomName,
  Room,
  Room333,
  RoomLinkset,
  RoomLinksetWithSession,
} from "./types.ts";

// -----------------------------------------------------------------------------
export interface RoomListResult {
  items: Room333[];
  total: number;
}

// -----------------------------------------------------------------------------
export interface ListRoomOptions {
  identityId: string;
  isSuperAdmin: boolean;
  limit: number;
  offset: number;
  search: string;
  enabled: boolean | null;
  domainId: string | null;
  ownerIdentityId?: string | null;
}

// -----------------------------------------------------------------------------
export async function getRoom(
  identityId: string,
  roomId: string,
  isSuperAdmin = false,
) {
  const sql = {
    text: `
      SELECT r.id, r.name, r.label, d.id as domain_id, d.name as domain_name,
        d.domain_attr->>'url' as domain_url,
        d.enabled as domain_enabled, r.has_suffix, r.enabled, r.created_at,
        r.updated_at, r.accessed_at
      FROM room r
        JOIN domain d ON r.domain_id = d.id
      WHERE r.id = $2
        AND ($3 OR r.identity_id = $1)`,
    args: [
      identityId,
      roomId,
      isSuperAdmin,
    ],
  };

  return await fetch(sql) as Room[];
}

// -----------------------------------------------------------------------------
export async function getRoomLinkset(
  identityId: string,
  roomId: string,
  isSuperAdmin = false,
) {
  await updateRoomSuffix(roomId);
  await updateRoomAccessTime(roomId);

  const sql = {
    text: `
      SELECT r.name, r.label, r.has_suffix, r.suffix, d.auth_type, d.domain_attr
      FROM room r
        JOIN domain d ON r.domain_id = d.id
                         AND d.enabled
        JOIN identity i ON d.identity_id = i.id
                           AND i.enabled
      WHERE r.id = $2
        AND ($3 OR r.identity_id = $1)
        AND (d.public OR d.identity_id = $1 OR $3)`,
    args: [
      identityId,
      roomId,
      isSuperAdmin,
    ],
  };

  return await fetch(sql) as RoomLinkset[];
}

// -----------------------------------------------------------------------------
export async function getPublicRoom(roomId: string) {
  const sql = {
    text: `
      SELECT r.id, r.label, r.name, r.short_code
      FROM room r
        JOIN domain d ON r.domain_id = d.id AND d.enabled
        JOIN identity i ON d.identity_id = i.id AND i.enabled
        JOIN identity ir ON r.identity_id = ir.id AND ir.enabled
      WHERE r.id = $1
        AND r.enabled`,
    args: [roomId],
  };

  return await fetch(sql) as {
    id: string;
    name: string;
    label: string;
    short_code: string;
  }[];
}

// -----------------------------------------------------------------------------
export async function getRoomLinksetByRoomHostKey(
  roomId: string,
  hostKey: string,
) {
  await updateRoomSuffix(roomId);
  await updateRoomAccessTime(roomId);

  const sql = {
    text: `
      SELECT r.name, r.label, r.has_suffix, r.suffix, d.auth_type, d.domain_attr
      FROM room r
        JOIN domain d ON r.domain_id = d.id AND d.enabled
        JOIN identity i ON d.identity_id = i.id AND i.enabled
        JOIN identity ir ON r.identity_id = ir.id AND ir.enabled
      WHERE r.id = $1
        AND r.host_key = $2
        AND r.enabled
        AND (d.public OR d.identity_id = r.identity_id)`,
    args: [roomId, hostKey],
  };

  return await fetch(sql) as RoomLinkset[];
}

// -----------------------------------------------------------------------------
export async function getRoomHostKey(
  identityId: string,
  roomId: string,
  isSuperAdmin = false,
) {
  const sql = {
    text: `
      SELECT host_key
      FROM room
      WHERE id = $2
        AND ($3 OR identity_id = $1)`,
    args: [identityId, roomId, isSuperAdmin],
  };

  return await fetch(sql) as { host_key: string }[];
}

// -----------------------------------------------------------------------------
export async function resetRoomHostKey(
  identityId: string,
  roomId: string,
  isSuperAdmin = false,
) {
  const sql = {
    text: `
      UPDATE room
      SET host_key = substr(md5(gen_random_uuid()::text), 1, 9),
          updated_at = now()
      WHERE id = $2
        AND ($3 OR identity_id = $1)
      RETURNING id, host_key, updated_at as at`,
    args: [identityId, roomId, isSuperAdmin],
  };

  return await fetch(sql) as { id: string; host_key: string; at: string }[];
}

// -----------------------------------------------------------------------------
export async function getRoomIdByName(
  identityId: string,
  domainUrl: string,
  roomName: string,
) {
  const sql = {
    text: `
      WITH room_owner AS (
        SELECT r.id,
               lower(
                 CASE
                   WHEN r.has_suffix THEN r.name || '-' || r.suffix
                   ELSE r.name
                 END
               ) as room_full_name,
               lower(coalesce(d.domain_attr->>'url', '')) as domain_url
        FROM room r
          JOIN domain d ON r.domain_id = d.id
                           AND d.enabled
          JOIN identity i ON d.identity_id = i.id
                             AND i.enabled
        WHERE r.identity_id = $1
            AND r.enabled
          AND (d.public OR d.identity_id = $1)
      )
      SELECT id, now() as at
      FROM room_owner
      WHERE ($2 = '' OR domain_url = lower($2))
        AND room_full_name = lower($3)
      LIMIT 1`,
    args: [
      identityId,
      domainUrl,
      roomName,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function getRandomRoomName(prefix: string) {
  const sql = {
    text: `
      SELECT
        $1 || md5(gen_random_uuid()::text) as name,
        md5(gen_random_uuid()::text) as suffix`,
    args: [prefix],
  };

  return await fetch(sql) as RandomRoomName[];
}

// -----------------------------------------------------------------------------
export async function getRoomUrl(
  identityId: string,
  roomLinkset: RoomLinkset,
  affiliation: Affiliation,
  exp: number,
  additionalHash: string,
) {
  const profiles = await getDefaultProfile(identityId);
  const profile = profiles[0];
  if (!profile) throw new Error("profile is not available");

  return await generateRoomUrl(
    roomLinkset,
    profile,
    affiliation,
    exp,
    additionalHash,
  );
}

// -----------------------------------------------------------------------------
export async function getRoomUrlByKey(
  keyValue: string,
  roomLinkset: RoomLinkset,
  affiliation: Affiliation,
  exp: number,
  additionalHash: string,
) {
  const profiles = await getDefaultProfileByKey(keyValue);
  const profile = profiles[0];
  if (!profile) throw new Error("profile is not available");

  return await generateRoomUrl(
    roomLinkset,
    profile,
    affiliation,
    exp,
    additionalHash,
  );
}

// -----------------------------------------------------------------------------
export async function getRoomLinksetByShortCode(shortCode: string) {
  const sql = {
    text: `
      SELECT r.name, r.label, r.has_suffix, r.suffix, d.auth_type, d.domain_attr
      FROM room r
        JOIN domain d ON r.domain_id = d.id
                         AND d.enabled
        JOIN identity i ON d.identity_id = i.id
                           AND i.enabled
        JOIN identity ir ON r.identity_id = ir.id
                            AND ir.enabled
      WHERE r.short_code = $1
        AND r.enabled`,
    args: [shortCode],
  };

  return await fetch(sql) as RoomLinkset[];
}

// -----------------------------------------------------------------------------
export async function getRoomLinksetByHostKey(
  roomId: string,
  hostKey: string,
) {
  const sql = {
    text: `
      SELECT r.name, r.label, r.has_suffix, r.suffix, d.auth_type, d.domain_attr,
        ses.started_at, ses.ended_at
      FROM meeting_schedule ms
        JOIN meeting m ON ms.meeting_id = m.id AND m.enabled
        JOIN room r ON m.room_id = r.id AND r.enabled
        JOIN domain d ON r.domain_id = d.id AND d.enabled
        JOIN identity i ON d.identity_id = i.id AND i.enabled
        JOIN identity i2 ON r.identity_id = i2.id AND i2.enabled
        JOIN meeting_session ses ON ms.id = ses.meeting_schedule_id
      WHERE r.id = $1
        AND ms.host_key = $2
        AND ms.enabled
        AND ses.ended_at > now()
        AND (d.public OR d.identity_id = r.identity_id)
      ORDER BY ses.started_at
      LIMIT 1`,
    args: [
      roomId,
      hostKey,
    ],
  };

  return await fetch(sql) as RoomLinksetWithSession[];
}

// -----------------------------------------------------------------------------
export async function getRoomLinksetByMeetingAndHostKey(
  meetingId: string,
  hostKey: string,
) {
  const sql = {
    text: `
      SELECT r.name, r.label, r.has_suffix, r.suffix, d.auth_type, d.domain_attr,
        ses.started_at, ses.ended_at
      FROM meeting_schedule ms
        JOIN meeting m ON ms.meeting_id = m.id AND m.enabled
        JOIN room r ON m.room_id = r.id AND r.enabled
        JOIN domain d ON r.domain_id = d.id AND d.enabled
        JOIN identity i ON d.identity_id = i.id AND i.enabled
        JOIN identity i2 ON r.identity_id = i2.id AND i2.enabled
        JOIN meeting_session ses ON ms.id = ses.meeting_schedule_id
      WHERE m.id = $1
        AND ms.host_key = $2
        AND ms.enabled
        AND ses.ended_at > now()
        AND (d.public OR d.identity_id = r.identity_id)
      ORDER BY ses.started_at
      LIMIT 1`,
    args: [
      meetingId,
      hostKey,
    ],
  };

  return await fetch(sql) as RoomLinksetWithSession[];
}

// -----------------------------------------------------------------------------
export async function listRoom(
  opts: ListRoomOptions,
): Promise<RoomListResult> {
  const {
    identityId,
    isSuperAdmin,
    limit,
    offset,
    search,
    enabled,
    domainId,
    ownerIdentityId = null,
  } = opts;
  const searchPattern = search ? `%${search}%` : null;

  if (isSuperAdmin) {
    const itemSql = {
      text: `
        SELECT r.id, r.name, r.label, r.short_code, d.name as domain_name,
          d.domain_attr->>'url' as domain_url,
          r.enabled,
          (d.enabled AND i.enabled) as chain_enabled,
          r.updated_at,
          ir.identity_attr->>'email' as owner_email,
          (SELECT name FROM profile WHERE identity_id = ir.id AND is_default LIMIT 1) as owner_name
        FROM room r
          JOIN domain d ON r.domain_id = d.id
          JOIN identity i ON d.identity_id = i.id
          JOIN identity ir ON r.identity_id = ir.id
        WHERE ($3::text IS NULL OR (r.name ILIKE $3 OR r.label ILIKE $3 OR r.short_code ILIKE $3 OR d.name ILIKE $3 OR ir.identity_attr->>'email' ILIKE $3))
          AND ($4::boolean IS NULL OR r.enabled = $4)
          AND ($5::uuid IS NULL OR r.domain_id = $5::uuid)
          AND ($6::uuid IS NULL OR r.identity_id = $6::uuid)
        ORDER BY name
        LIMIT $1 OFFSET $2`,
      args: [limit, offset, searchPattern, enabled, domainId, ownerIdentityId],
    };

    const countSql = {
      text: `
        SELECT count(*) as total
        FROM room r
          JOIN domain d ON r.domain_id = d.id
          JOIN identity i ON d.identity_id = i.id
          JOIN identity ir ON r.identity_id = ir.id
        WHERE ($1::text IS NULL OR (r.name ILIKE $1 OR r.label ILIKE $1 OR r.short_code ILIKE $1 OR d.name ILIKE $1 OR ir.identity_attr->>'email' ILIKE $1))
          AND ($2::boolean IS NULL OR r.enabled = $2)
          AND ($3::uuid IS NULL OR r.domain_id = $3::uuid)
          AND ($4::uuid IS NULL OR r.identity_id = $4::uuid)`,
      args: [searchPattern, enabled, domainId, ownerIdentityId],
    };

    const [items, countRows] = await Promise.all([
      fetch(itemSql) as Promise<Room333[]>,
      fetch(countSql) as Promise<{ total: string }[]>,
    ]);
    return { items, total: Number(countRows[0].total) };
  }

  // updated_at is used by UI to pick the newest one
  const itemSql = {
    text: `
      SELECT r.id, r.name, r.label, r.short_code, d.name as domain_name,
        d.domain_attr->>'url' as domain_url,
        r.enabled,
        (d.enabled AND i.enabled AND (d.identity_id = $1 OR d.public)) as chain_enabled,
        r.updated_at
      FROM room r
        JOIN domain d ON r.domain_id = d.id
        JOIN identity i ON d.identity_id = i.id
      WHERE r.identity_id = $1
        AND ($4::text IS NULL OR (r.name ILIKE $4 OR r.label ILIKE $4 OR r.short_code ILIKE $4 OR d.name ILIKE $4))
        AND ($5::boolean IS NULL OR r.enabled = $5)
        AND ($6::uuid IS NULL OR r.domain_id = $6::uuid)
      ORDER BY name
      LIMIT $2 OFFSET $3`,
    args: [identityId, limit, offset, searchPattern, enabled, domainId],
  };

  const countSql = {
    text: `
      SELECT count(*) as total
      FROM room r
        JOIN domain d ON r.domain_id = d.id
        JOIN identity i ON d.identity_id = i.id
      WHERE r.identity_id = $1
        AND ($2::text IS NULL OR (r.name ILIKE $2 OR r.label ILIKE $2 OR r.short_code ILIKE $2 OR d.name ILIKE $2))
        AND ($3::boolean IS NULL OR r.enabled = $3)
        AND ($4::uuid IS NULL OR r.domain_id = $4::uuid)`,
    args: [identityId, searchPattern, enabled, domainId],
  };

  const [items, countRows] = await Promise.all([
    fetch(itemSql) as Promise<Room333[]>,
    fetch(countSql) as Promise<{ total: string }[]>,
  ]);
  return { items, total: Number(countRows[0].total) };
}

// -----------------------------------------------------------------------------
export async function addRoom(
  identityId: string,
  domainId: string,
  name: string,
  label: string,
  hasSuffix: boolean,
  isSuperAdmin = false,
) {
  const sql = {
    text: `
      INSERT INTO room (identity_id, domain_id, name, label, has_suffix)
      VALUES (
        $1,
        (SELECT id
         FROM domain d
         WHERE id = $2
           AND enabled
           AND ($6
                OR public
                OR EXISTS (
                  SELECT 1 FROM domain_member dm
                  WHERE dm.domain_id = d.id
                    AND dm.email = (
                      SELECT identity_attr->>'email'
                      FROM identity WHERE id = $1
                    )
                ))
        ),
        $3, $4, $5)
      RETURNING id, created_at as at`,
    args: [
      identityId,
      domainId,
      name,
      label,
      hasSuffix,
      isSuperAdmin,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function delRoom(
  identityId: string,
  roomId: string,
  isSuperAdmin = false,
) {
  const sql = {
    text: `
      DELETE FROM room
      WHERE id = $2
        AND ($3 OR identity_id = $1)
      RETURNING id, now() as at`,
    args: [
      identityId,
      roomId,
      isSuperAdmin,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function updateRoom(
  identityId: string,
  roomId: string,
  domainId: string,
  name: string,
  label: string,
  hasSuffix: boolean,
  isSuperAdmin = false,
) {
  const sql = {
    text: `
      UPDATE room
      SET
        domain_id = (SELECT id
                     FROM domain d
                     WHERE id = $3
                       AND enabled
                       AND ($7
                            OR public
                            OR EXISTS (
                              SELECT 1 FROM domain_member dm
                              WHERE dm.domain_id = d.id
                                AND dm.email = (
                                  SELECT identity_attr->>'email'
                                  FROM identity WHERE id = $1
                                )
                            ))
                    ),
        name = $4,
        label = $5,
        has_suffix = $6,
        updated_at = now()
      WHERE id = $2
        AND ($7 OR identity_id = $1)
      RETURNING id, updated_at as at`,
    args: [
      identityId,
      roomId,
      domainId,
      name,
      label,
      hasSuffix,
      isSuperAdmin,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function updateRoomEnabled(
  identityId: string,
  roomId: string,
  value = true,
  isSuperAdmin = false,
) {
  const sql = {
    text: `
      UPDATE room
      SET
        enabled = $3,
        updated_at = now()
      WHERE id = $2
        AND ($4 OR identity_id = $1)
      RETURNING id, updated_at as at`,
    args: [
      identityId,
      roomId,
      value,
      isSuperAdmin,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function updateRoomSuffix(roomId: string) {
  const sql = {
    text: `
      UPDATE room
      SET
        suffix = DEFAULT
      WHERE id = $1
        AND has_suffix
        AND accessed_at + interval '4 hours' < now()
      RETURNING id, now() as at`,
    args: [
      roomId,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function updateRoomAccessTime(roomId: string) {
  const sql = {
    text: `
      UPDATE room
      SET
        accessed_at = now(),
        attendance = attendance + 1
      WHERE id = $1
      RETURNING id, accessed_at as at`,
    args: [
      roomId,
    ],
  };

  return await fetch(sql) as Id[];
}
