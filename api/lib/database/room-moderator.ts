import { fetch } from "./common.ts";
import { HttpError } from "../http/error.ts";

const managedRoom = `SELECT r.id, r.identity_id FROM room r
  JOIN identity actor ON actor.id = $1 AND actor.enabled
  WHERE r.id = $2 AND (r.identity_id = actor.id OR actor.is_superadmin)`;

export async function listRoomModerators(actor: string, room: string) {
  const rows = await fetch({
    text: `SELECT ARRAY(
             SELECT json_build_object('id', i.id, 'email', i.identity_attr->>'email')
             FROM room_partner rp JOIN identity i ON i.id = rp.identity_id
             WHERE rp.room_id = managed.id AND rp.enabled
             ORDER BY lower(i.identity_attr->>'email'), i.id
           ) AS members FROM (${managedRoom}) managed`,
    args: [actor, room],
  }) as { members: { id: string; email: string | null }[] }[];
  if (!rows.length) throw new HttpError(404, "Room unavailable");
  return rows[0].members;
}

export async function addRoomModerator(
  actor: string,
  room: string,
  email: string,
) {
  const rows = await fetch({
    text: `WITH candidates AS (
             SELECT id, count(*) OVER () AS matches FROM identity
             WHERE enabled AND lower(identity_attr->>'email') = lower($3)
           )
           INSERT INTO room_partner (room_id, identity_id)
           SELECT managed.id, c.id FROM (${managedRoom}) managed
           JOIN candidates c ON c.matches = 1 AND c.id <> managed.identity_id
           ON CONFLICT (identity_id, room_id)
           DO UPDATE SET enabled = true, updated_at = now()
           RETURNING identity_id AS id`,
    args: [actor, room, email],
  });
  if (!rows.length) {
    throw new HttpError(404, "Room or eligible account unavailable");
  }
  return rows;
}

export async function removeRoomModerator(
  actor: string,
  room: string,
  member: string,
) {
  const rows = await fetch({
    text: `DELETE FROM room_partner rp USING (${managedRoom}) managed
           WHERE rp.room_id = managed.id AND rp.identity_id = $3
           RETURNING rp.identity_id AS id`,
    args: [actor, room, member],
  });
  if (!rows.length) throw new HttpError(404, "Room moderator unavailable");
  return rows;
}
