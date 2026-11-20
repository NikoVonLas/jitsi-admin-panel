// SQL fragments use r for the room, d for the domain and m for the meeting.
export function activeRoomModerator(identity: "$1" | "m.identity_id"): string {
  return `EXISTS (
    SELECT 1 FROM room_partner rp
    JOIN identity actor ON actor.id = rp.identity_id AND actor.enabled
    WHERE rp.room_id = r.id AND rp.identity_id = ${identity} AND rp.enabled
  )`;
}

export const ownerCanUseDomain =
  `(d.public OR d.identity_id = r.identity_id OR EXISTS (
  SELECT 1 FROM domain_member dm JOIN identity owner ON owner.id = r.identity_id
  WHERE dm.domain_id = d.id AND dm.email = owner.identity_attr->>'email'
))`;

// Re-check the organizer when using a scheduled conference, including public links.
export const organizerHasRoom = `(m.identity_id = r.identity_id OR EXISTS (
  SELECT 1 FROM identity admin WHERE admin.id = m.identity_id AND admin.enabled AND admin.is_superadmin
) OR ${activeRoomModerator("m.identity_id")})`;

export const organizerCanHost = `(${organizerHasRoom}
  AND (m.identity_id <> r.identity_id OR ${ownerCanUseDomain}
       OR EXISTS (SELECT 1 FROM identity admin WHERE admin.id = m.identity_id AND admin.is_superadmin)))`;
