import { notFound } from "../http/response.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import { generateMeetingUrl } from "../common/helper.ts";
import { parseEnabledFilter } from "../common/parse.ts";
import { getLimit, getOffset } from "../database/common.ts";
import { getIsSuperAdmin } from "../database/identity.ts";
import { getDefaultProfile } from "../database/profile.ts";
import {
  addMeeting,
  delMeeting,
  getMeeting,
  getMeeting222ById,
  getMeetingLinkset,
  listMeeting,
  updateMeeting,
  updateMeetingEnabled,
} from "../database/meeting.ts";

const PRE = "/api/pri/meeting";

// -----------------------------------------------------------------------------
async function get(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const meetingId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await getMeeting(identityId, meetingId, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function getLink(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const meetingId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  const linkset = await getMeetingLinkset(identityId, meetingId, isSuperAdmin)
    .then((rows) => rows[0])
    .catch(() => null);
  if (!linkset) return [];

  if (isSuperAdmin) {
    const profile = await getDefaultProfile(identityId).then((rows) => rows[0])
      .catch(() => null);
    if (profile) {
      linkset.profile_name = profile.name;
      linkset.profile_email = profile.email;
      linkset.profile_avatar_url = profile.avatar_url ?? "";
    }
  }

  let remaining = 3600;
  if (linkset.remaining) remaining = linkset.remaining;

  const moderator_url = await generateMeetingUrl(linkset, remaining);
  const participantLinkset = {
    ...linkset,
    auth_type: "none",
    profile_name: "",
    profile_email: "",
    profile_avatar_url: "",
  };
  const url = await generateMeetingUrl(participantLinkset, remaining);

  return [{ url, moderator_url }];
}

// -----------------------------------------------------------------------------
async function list(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const limit = getLimit(pl.limit);
  const offset = getOffset(pl.offset);
  const search = typeof pl.search === "string" ? pl.search.trim() : "";
  const enabled = parseEnabledFilter(pl.enabled);
  const hasSession = parseEnabledFilter(pl.has_session);
  const roomId = typeof pl.room_id === "string" && pl.room_id
    ? pl.room_id
    : null;
  const domainId = typeof pl.domain_id === "string" && pl.domain_id
    ? pl.domain_id
    : null;
  const ownerIdentityId = typeof pl.identity_id === "string" && pl.identity_id
    ? pl.identity_id
    : null;
  const sessionDate = typeof pl.session_date === "string" && pl.session_date
    ? pl.session_date
    : null;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await listMeeting({
    identityId,
    isSuperAdmin,
    limit,
    offset,
    search,
    enabled,
    hasSession,
    roomId,
    domainId,
    ownerIdentityId,
    sessionDate,
  });
}

// -----------------------------------------------------------------------------
async function add(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const profileId = pl.profile_id;
  const roomId = pl.room_id;
  const name = pl.name;
  const info = pl.info;
  const hidden = pl.hidden;
  const subscribable = pl.subscribable;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await addMeeting({
    identityId,
    profileId,
    roomId,
    name,
    info,
    hidden,
    subscribable,
    isSuperAdmin,
  });
}

// -----------------------------------------------------------------------------
async function del(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const meetingId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await delMeeting(identityId, meetingId, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function update(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const meetingId = pl.id;
  const profileId = pl.profile_id;
  const roomId = pl.room_id;
  const name = pl.name;
  const info = pl.info;
  const hidden = pl.hidden;
  const subscribable = pl.subscribable;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await updateMeeting({
    identityId,
    meetingId,
    profileId,
    roomId,
    name,
    info,
    hidden,
    subscribable,
    isSuperAdmin,
  });
}

// -----------------------------------------------------------------------------
async function getAsCard(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const meetingId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await getMeeting222ById(identityId, meetingId, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function enable(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const meetingId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await updateMeetingEnabled(identityId, meetingId, true, isSuperAdmin);
}

// -----------------------------------------------------------------------------
async function disable(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const meetingId = pl.id;

  const isSuperAdmin = await getIsSuperAdmin(identityId);

  return await updateMeetingEnabled(identityId, meetingId, false, isSuperAdmin);
}

// -----------------------------------------------------------------------------
export default async function routeMeeting(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (path === `${PRE}/get`) {
    return await wrapper(get, req, identityId);
  } else if (path === `${PRE}/get/ascard`) {
    return await wrapper(getAsCard, req, identityId);
  } else if (path === `${PRE}/get/link`) {
    return await wrapper(getLink, req, identityId);
  } else if (path === `${PRE}/list`) {
    return await wrapper(list, req, identityId);
  } else if (path === `${PRE}/add`) {
    return await wrapper(add, req, identityId);
  } else if (path === `${PRE}/del`) {
    return await wrapper(del, req, identityId);
  } else if (path === `${PRE}/update`) {
    return await wrapper(update, req, identityId);
  } else if (path === `${PRE}/enable`) {
    return await wrapper(enable, req, identityId);
  } else if (path === `${PRE}/disable`) {
    return await wrapper(disable, req, identityId);
  } else {
    return notFound();
  }
}
