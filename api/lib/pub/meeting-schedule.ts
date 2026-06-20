import { notFound } from "../http/response.ts";
import { pub as wrapper } from "../http/wrapper.ts";
import { EMPTY_PROFILE, generateRoomUrl } from "../common/helper.ts";
import { getMeetingScheduleByCode } from "../database/meeting-schedule.ts";
import { getRoomLinksetByMeetingAndHostKey } from "../database/room.ts";

const PRE = "/api/pub/meeting/schedule";

// -----------------------------------------------------------------------------
async function getByCode(req: Request): Promise<unknown> {
  const pl = await req.json();
  const code = pl.code;

  return await getMeetingScheduleByCode(code);
}

// -----------------------------------------------------------------------------
async function joinAsMod(req: Request): Promise<unknown> {
  const pl = await req.json();
  const meetingId = pl.meeting_id;
  const hostKey = pl.host_key;

  if (!meetingId || !hostKey) return [];

  const rows = await getRoomLinksetByMeetingAndHostKey(meetingId, hostKey);
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
export default async function handlePubMeetingSchedule(
  req: Request,
  path: string,
): Promise<Response> {
  if (path === `${PRE}/get/bycode`) {
    return await wrapper(getByCode, req);
  } else if (path === `${PRE}/join/asmod`) {
    return await wrapper(joinAsMod, req);
  } else {
    return notFound();
  }
}
