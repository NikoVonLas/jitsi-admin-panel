import { notFound } from "../http/response.ts";
import { pub as wrapper } from "../http/wrapper.ts";
import { EMPTY_PROFILE, generateRoomUrl } from "../common/helper.ts";
import {
  getPublicRoom,
  getRoomLinksetByHostKey,
  getRoomLinksetByRoomHostKey,
  getRoomLinksetByShortCode,
} from "../database/room.ts";

const PRE = "/api/pub/room";

// -----------------------------------------------------------------------------
async function joinAsMod(req: Request): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.room_id;
  const hostKey = pl.host_key;

  if (!roomId || !hostKey) return [];

  const rows = await getRoomLinksetByHostKey(roomId, hostKey);
  if (!rows[0]) return [];

  const linkset = rows[0];
  const startAvailable = new Date(linkset.started_at).getTime() -
    10 * 60 * 1000;
  if (Date.now() < startAvailable) {
    return [{ error: "too_early" }];
  }

  const remaining = Math.max(
    1,
    Math.floor(
      (new Date(linkset.ended_at).getTime() - Date.now()) / 1000,
    ),
  );
  const url = await generateRoomUrl(
    linkset,
    EMPTY_PROFILE,
    "host",
    remaining,
    "",
  );

  return [{ url }];
}

// -----------------------------------------------------------------------------
async function get(req: Request): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.id;

  return await getPublicRoom(roomId);
}

// -----------------------------------------------------------------------------
async function joinAsModByRoom(req: Request): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.room_id;
  const hostKey = pl.host_key;

  if (!roomId || !hostKey) return [];

  const rows = await getRoomLinksetByRoomHostKey(roomId, hostKey);
  if (!rows[0]) return [{ error: "invalid" }];

  const linkset = rows[0];
  const url = await generateRoomUrl(linkset, EMPTY_PROFILE, "host", 3600, "");

  return [{ url }];
}

// -----------------------------------------------------------------------------
async function getLinkByShortCode(req: Request): Promise<unknown> {
  const pl = await req.json();
  const shortCode = pl.short_code;

  const linkset = await getRoomLinksetByShortCode(shortCode)
    .then((rows) => rows[0])
    .catch(() => null);
  if (!linkset) return [];

  // Build URL without a JWT so users join as unauthenticated guests via
  // guest.meet.jitsi domain. This prevents Jicofo from granting them OWNER.
  let roomName = encodeURIComponent(linkset.name);
  if (linkset.has_suffix) roomName = `${roomName}-${linkset.suffix}`;

  let url: string;
  if (linkset.auth_type === "jaas") {
    const sub = encodeURIComponent(linkset.domain_attr.jaas_app_id);
    url = `${encodeURI(linkset.domain_attr.jaas_url)}/${sub}/${roomName}`;
  } else {
    url = `${encodeURI(linkset.domain_attr.url)}/${roomName}`;
  }

  const subject = encodeURIComponent(`"${linkset.label || linkset.name}"`);
  url = `${url}#config.localSubject=${subject}`;

  return [{ url }];
}

// -----------------------------------------------------------------------------
export default async function handlePubRoom(
  req: Request,
  path: string,
): Promise<Response> {
  if (path === `${PRE}/get`) {
    return await wrapper(get, req);
  } else if (path === `${PRE}/get/link/byshortcode`) {
    return await wrapper(getLinkByShortCode, req);
  } else if (path === `${PRE}/join/asmod`) {
    return await wrapper(joinAsMod, req);
  } else if (path === `${PRE}/join/asmod/byroom`) {
    return await wrapper(joinAsModByRoom, req);
  } else {
    return notFound();
  }
}
