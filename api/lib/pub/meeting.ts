import { generateMeetingParticipantUrl } from "../common/helper.ts";
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

  const url = await generateMeetingParticipantUrl(linkset);
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
