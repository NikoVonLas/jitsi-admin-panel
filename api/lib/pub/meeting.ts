import { notFound } from "../http/response.ts";
import { pub as wrapper } from "../http/wrapper.ts";
import { getLimit, getOffset } from "../database/common.ts";
import {
  getMeetingForMod,
  getMeetingLinksetByShortCode,
  getPublicMeeting,
  listPublicMeeting,
} from "../database/meeting.ts";

const PRE = "/api/pub/meeting";

// -----------------------------------------------------------------------------
async function get(req: Request): Promise<unknown> {
  const pl = await req.json();
  const meetingId = pl.id;

  return await getPublicMeeting(meetingId);
}

// -----------------------------------------------------------------------------
async function getLinkByShortCode(req: Request): Promise<unknown> {
  const pl = await req.json();
  const shortCode = pl.short_code;

  const linkset = await getMeetingLinksetByShortCode(shortCode)
    .then((rows) => rows[0])
    .catch(() => null);
  if (!linkset) return [];

  // Build URL without a JWT so participants join as unauthenticated guests via
  // guest.meet.jitsi domain. This prevents Jicofo from granting them OWNER.
  let roomName = encodeURIComponent(linkset.room_name);
  if (linkset.has_suffix) roomName = `${roomName}-${linkset.suffix}`;

  let url = `${encodeURI(linkset.domain_attr.url)}/${roomName}`;

  let subject: string;
  if (linkset.schedule_name) {
    subject = encodeURIComponent(`"${linkset.schedule_name}, ${linkset.name}"`);
  } else {
    subject = encodeURIComponent(`"${linkset.name}"`);
  }
  url = `${url}#config.localSubject=${subject}`;

  return [{ url }];
}

// -----------------------------------------------------------------------------
async function getForMod(req: Request): Promise<unknown> {
  const pl = await req.json();
  const meetingId = pl.id;

  return await getMeetingForMod(meetingId);
}

// -----------------------------------------------------------------------------
async function listEnabled(req: Request): Promise<unknown> {
  const pl = await req.json();
  const limit = getLimit(pl.limit);
  const offset = getOffset(pl.offset);

  return await listPublicMeeting(limit, offset);
}

// -----------------------------------------------------------------------------
export default async function handlePubMeeting(
  req: Request,
  path: string,
): Promise<Response> {
  if (path === `${PRE}/get`) {
    return await wrapper(get, req);
  } else if (path === `${PRE}/get/formod`) {
    return await wrapper(getForMod, req);
  } else if (path === `${PRE}/get/link/byshortcode`) {
    return await wrapper(getLinkByShortCode, req);
  } else if (path === `${PRE}/list`) {
    return await wrapper(listEnabled, req);
  } else {
    return notFound();
  }
}
