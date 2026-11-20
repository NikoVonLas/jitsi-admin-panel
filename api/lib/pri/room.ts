import {
  conflict,
  internalServerError,
  notFound,
  ok,
} from "../http/response.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import { HttpError } from "../http/error.ts";
import {
  addRoomModerator,
  listRoomModerators,
  removeRoomModerator,
} from "../database/room-moderator.ts";
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
  isRoomNameTaken,
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

  return getRoom(identityId, roomId, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function getLink(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  const room = await getRoomLinkset(identityId, roomId, isSuperAdmin)
    .then((rows) => rows[0]);
  if (!room) return [];

  const profile = await getDefaultProfile(identityId)
    .then((rows) => rows[0]);
  if (!profile) return [];

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

  return getRoomHostKey(identityId, roomId, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function resetHostKey(
  req: Request,
  identityId: string,
): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return resetRoomHostKey(identityId, roomId, isSuperAdmin);
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
    .catch((e) => {
      console.error("getRoomIdByName failed:", e);
      return null;
    });
  if (!roomIds) return [];

  const room = await getRoomLinkset(identityId, roomIds.id)
    .then((rows) => rows[0])
    .catch((e) => {
      console.error("getRoomLinkset failed:", e);
      return null;
    });
  if (!room) return [];

  const profile = await getDefaultProfile(identityId)
    .then((rows) => rows[0]);
  if (!profile) return [];

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

  return listRoom({
    identityId,
    isSuperAdmin,
    limit,
    offset,
    search,
    enabled,
    domainId,
    ownerIdentityId,
    includeShared: pl.include_shared === true,
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

  return addRoom(
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

  return delRoom(identityId, roomId, isSuperAdmin);
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

  return updateRoom(
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

  return updateRoomEnabled(identityId, roomId, true, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function disable(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const roomId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return updateRoomEnabled(identityId, roomId, false, isSuperAdmin);
}

// -----------------------------------------------------------------------------
type WriteFn = (req: Request, identityId: string) => Promise<unknown>;

async function handleWrite(
  fn: WriteFn,
  req: Request,
  identityId: string,
): Promise<Response> {
  try {
    return ok(JSON.stringify(await fn(req, identityId)));
  } catch (e) {
    if (isRoomNameTaken(e)) return conflict("room_name_taken");
    if ((e as { fields?: { code?: string } })?.fields?.code === "23505") {
      return conflict();
    }
    return internalServerError();
  }
}

function handleAdd(req: Request, identityId: string): Promise<Response> {
  return handleWrite(add, req, identityId);
}

function handleUpdate(req: Request, identityId: string): Promise<Response> {
  return handleWrite(update, req, identityId);
}

function moderatorId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new HttpError(400, "Invalid ID");
  }
  return value;
}

async function listModerators(req: Request, actor: string) {
  const body = await req.json();
  return listRoomModerators(actor, moderatorId(body?.id));
}

async function addModerator(req: Request, actor: string) {
  const body = await req.json();
  const room = moderatorId(body?.id);
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || email.length > 320) throw new HttpError(400, "Invalid email");
  return addRoomModerator(actor, room, email);
}

async function removeModerator(req: Request, actor: string) {
  const body = await req.json();
  return removeRoomModerator(
    actor,
    moderatorId(body?.id),
    moderatorId(body?.identity_id),
  );
}

// -----------------------------------------------------------------------------
export default function routeRoom(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (path === `${PRE}/moderators/list`) {
    return wrapper(listModerators, req, identityId);
  }
  if (path === `${PRE}/moderators/add`) {
    return wrapper(addModerator, req, identityId);
  }
  if (path === `${PRE}/moderators/remove`) {
    return wrapper(removeModerator, req, identityId);
  }
  if (path === `${PRE}/get`) {
    return wrapper(get, req, identityId);
  } else if (path === `${PRE}/get/link`) {
    return wrapper(getLink, req, identityId);
  } else if (path === `${PRE}/get/link/byname`) {
    return wrapper(getLinkByName, req, identityId);
  } else if (path === `${PRE}/list`) {
    return wrapper(list, req, identityId);
  } else if (path === `${PRE}/add`) {
    return handleAdd(req, identityId);
  } else if (path === `${PRE}/del`) {
    return wrapper(del, req, identityId);
  } else if (path === `${PRE}/update`) {
    return handleUpdate(req, identityId);
  } else if (path === `${PRE}/enable`) {
    return wrapper(enable, req, identityId);
  } else if (path === `${PRE}/disable`) {
    return wrapper(disable, req, identityId);
  } else if (path === `${PRE}/get/hostkey`) {
    return wrapper(getHostKey, req, identityId);
  } else if (path === `${PRE}/reset/hostkey`) {
    return wrapper(resetHostKey, req, identityId);
  } else {
    return Promise.resolve(notFound());
  }
}
