import {
  conflict,
  internalServerError,
  notFound,
  ok,
} from "../http/response.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import { generateRoomUrl } from "../common/helper.ts";
import { parseEnabledFilter } from "../common/parse.ts";
import { getLimit, getOffset } from "../database/common.ts";
import { getIsSuperAdmin } from "../database/identity.ts";
import { getDefaultProfile } from "../database/profile.ts";
import {
  addRoom,
  delRoom,
  getRoom,
  getRoomHostKey,
  getRoomIdByName,
  getRoomLinkset,
  listRoom,
  resetRoomHostKey,
  updateRoom,
  updateRoomEnabled,
} from "../database/room.ts";

const PRE = "/api/pri/room";

// -----------------------------------------------------------------------------
function trimTrailingSlashes(s: string): string {
  let end = s.length;
  while (end > 0 && s[end - 1] === "/") end--;
  return s.slice(0, end);
}

// -----------------------------------------------------------------------------
async function get(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await getRoom(identityId, roomId, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function getLink(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  const room = await getRoomLinkset(identityId, roomId, isSuperAdmin)
    .then((rows) => rows[0]);
  const profile = await getDefaultProfile(identityId)
    .then((rows) => rows[0]);
  const url = await generateRoomUrl(room, profile, "host");
  const guestUrl = await generateRoomUrl(room, profile, "guest");

  const link = [{
    url: url,
    guest_url: guestUrl,
  }];

  return link;
}

// -----------------------------------------------------------------------------
async function getHostKey(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await getRoomHostKey(identityId, roomId, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function resetHostKey(
  req: Request,
  identityId: string,
): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await resetRoomHostKey(identityId, roomId, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function getLinkByName(
  req: Request,
  identityId: string,
): Promise<unknown> {
  const pl = await req.json();
  const rawRoomName = (typeof pl.room_name === "string")
    ? pl.room_name.trim()
    : "";
  const rawDomainUrl = (typeof pl.domain_url === "string")
    ? pl.domain_url.trim()
    : "";

  if (!rawRoomName) return [];

  const domainUrl = trimTrailingSlashes(rawDomainUrl);
  const roomIds = await getRoomIdByName(identityId, domainUrl, rawRoomName)
    .then((rows) => rows[0])
    .catch(() => null);
  if (!roomIds) return [];

  const room = await getRoomLinkset(identityId, roomIds.id)
    .then((rows) => rows[0])
    .catch(() => null);
  if (!room) return [];

  const profile = await getDefaultProfile(identityId)
    .then((rows) => rows[0]);
  const url = await generateRoomUrl(room, profile);

  const link = [{
    url: url,
  }];

  return link;
}

// -----------------------------------------------------------------------------
async function list(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const limit = getLimit(pl.limit);
  const offset = getOffset(pl.offset);
  const search = typeof pl.search === "string" ? pl.search.trim() : "";
  const enabled = parseEnabledFilter(pl.enabled);
  const domainId = typeof pl.domain_id === "string" && pl.domain_id
    ? pl.domain_id
    : null;
  const ownerIdentityId = typeof pl.identity_id === "string" && pl.identity_id
    ? pl.identity_id
    : null;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await listRoom({
    identityId,
    isSuperAdmin,
    limit,
    offset,
    search,
    enabled,
    domainId,
    ownerIdentityId,
  });
}

// -----------------------------------------------------------------------------
async function add(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const domainId = pl.domain_id;
  const name = pl.name;
  const label = pl.label ?? "";
  const hasSuffix = pl.has_suffix === true;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await addRoom(
    identityId,
    domainId,
    name,
    label,
    hasSuffix,
    isSuperAdmin,
  );
}

// -----------------------------------------------------------------------------
async function del(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await delRoom(identityId, roomId, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function update(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.id;
  const domainId = pl.domain_id;
  const name = pl.name;
  const label = pl.label ?? "";
  const hasSuffix = pl.has_suffix === true;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await updateRoom(
    identityId,
    roomId,
    domainId,
    name,
    label,
    hasSuffix,
    isSuperAdmin,
  );
}

// -----------------------------------------------------------------------------
async function enable(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await updateRoomEnabled(identityId, roomId, true, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function disable(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await updateRoomEnabled(identityId, roomId, false, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function handleAdd(req: Request, identityId: string): Promise<Response> {
  try {
    return ok(JSON.stringify(await add(req, identityId)));
  } catch (e) {
    if ((e as { fields?: { code?: string } })?.fields?.code === "23505") {
      return conflict();
    }
    return internalServerError();
  }
}

// -----------------------------------------------------------------------------
async function handleUpdate(
  req: Request,
  identityId: string,
): Promise<Response> {
  try {
    return ok(JSON.stringify(await update(req, identityId)));
  } catch (e) {
    if ((e as { fields?: { code?: string } })?.fields?.code === "23505") {
      return conflict();
    }
    return internalServerError();
  }
}

// -----------------------------------------------------------------------------
export default async function routeRoom(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (path === `${PRE}/get`) {
    return await wrapper(get, req, identityId);
  } else if (path === `${PRE}/get/link`) {
    return await wrapper(getLink, req, identityId);
  } else if (path === `${PRE}/get/link/byname`) {
    return await wrapper(getLinkByName, req, identityId);
  } else if (path === `${PRE}/list`) {
    return await wrapper(list, req, identityId);
  } else if (path === `${PRE}/add`) {
    return await handleAdd(req, identityId);
  } else if (path === `${PRE}/del`) {
    return await wrapper(del, req, identityId);
  } else if (path === `${PRE}/update`) {
    return await handleUpdate(req, identityId);
  } else if (path === `${PRE}/enable`) {
    return await wrapper(enable, req, identityId);
  } else if (path === `${PRE}/disable`) {
    return await wrapper(disable, req, identityId);
  } else if (path === `${PRE}/get/hostkey`) {
    return await wrapper(getHostKey, req, identityId);
  } else if (path === `${PRE}/reset/hostkey`) {
    return await wrapper(resetHostKey, req, identityId);
  } else {
    return notFound();
  }
}
