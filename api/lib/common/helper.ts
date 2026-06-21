import {
  generateGuestTokenHS,
  generateGuestTokenJaas,
  generateHostTokenHS,
  generateHostTokenJaas,
} from "./token.ts";
import type {
  Affiliation,
  MeetingLinkset,
  Profile,
  RoomLinkset,
} from "../database/types.ts";
import { APP_FQDN, APP_SCHEME } from "../../config.ts";

// -----------------------------------------------------------------------------
export const EMPTY_PROFILE = {
  id: "",
  name: "",
  email: "",
  avatar_url: "",
  is_default: false,
  created_at: "",
  updated_at: "",
} as const;

// Expand a relative path (e.g. /api/pub/avatar/foo.jpg) to an absolute URL.
// Already-absolute URLs are returned as-is.
function toAbsoluteUrl(url: string): string {
  if (!url || url.startsWith("http://") || url.startsWith("https://")) { // NOSONAR: string prefix check, not a network call
    return url;
  }
  return `${APP_SCHEME}://${APP_FQDN}${url}`;
}

// -----------------------------------------------------------------------------
async function generateRoomUrlJaas(
  linkset: RoomLinkset,
  profile: Profile,
  affiliation: Affiliation,
  exp: number,
): Promise<string> {
  const sub = encodeURIComponent(linkset.domain_attr.jaas_app_id);
  let url = encodeURI(linkset.domain_attr.jaas_url);
  let roomName = encodeURIComponent(linkset.name);

  if (linkset.has_suffix) roomName = `${roomName}-${linkset.suffix}`;
  url = `${url}/${sub}/${roomName}`;

  if (affiliation === "host") {
    const jwt = await generateHostTokenJaas({
      jaasAppId: linkset.domain_attr.jaas_app_id,
      jaasKid: linkset.domain_attr.jaas_kid,
      jaasKey: linkset.domain_attr.jaas_key,
      jaasAlg: linkset.domain_attr.jaas_alg,
      jaasAud: linkset.domain_attr.jaas_aud,
      jaasIss: linkset.domain_attr.jaas_iss,
      roomName,
      username: profile.name,
      email: profile.email,
      exp,
    });

    return `${url}?jwt=${jwt}`;
  }

  const jwt = await generateGuestTokenJaas({
    jaasAppId: linkset.domain_attr.jaas_app_id,
    jaasKid: linkset.domain_attr.jaas_kid,
    jaasKey: linkset.domain_attr.jaas_key,
    jaasAlg: linkset.domain_attr.jaas_alg,
    jaasAud: linkset.domain_attr.jaas_aud,
    jaasIss: linkset.domain_attr.jaas_iss,
    roomName,
    username: profile.name,
    email: profile.email,
    exp,
  });

  return `${url}?jwt=${jwt}`;
}

// -----------------------------------------------------------------------------
async function generateRoomUrlToken(
  linkset: RoomLinkset,
  profile: Profile,
  affiliation: Affiliation,
  exp: number,
): Promise<string> {
  let url = encodeURI(linkset.domain_attr.url);
  let roomName = encodeURIComponent(linkset.name);

  if (linkset.has_suffix) roomName = `${roomName}-${linkset.suffix}`;
  url = `${url}/${roomName}`;

  if (affiliation === "host") {
    const jwt = await generateHostTokenHS({
      appId: linkset.domain_attr.app_id,
      appSecret: linkset.domain_attr.app_secret,
      appAlg: linkset.domain_attr.app_alg,
      roomName,
      username: profile.name,
      email: profile.email,
      exp,
      avatar: profile.avatar_url,
    });

    return `${url}?jwt=${jwt}`;
  }

  const jwt = await generateGuestTokenHS({
    appId: linkset.domain_attr.app_id,
    appSecret: linkset.domain_attr.app_secret,
    appAlg: linkset.domain_attr.app_alg,
    roomName,
    username: profile.name,
    email: profile.email,
    exp,
    avatar: profile.avatar_url,
  });

  return `${url}?jwt=${jwt}`;
}

// -----------------------------------------------------------------------------
export async function generateRoomUrl(
  linkset: RoomLinkset,
  profile: Profile,
  affiliation = "host" as Affiliation,
  exp = 3600,
  additionalHash = "",
): Promise<string> {
  let url: string;

  if (!profile.name) profile.name = "";
  if (!profile.email) profile.email = "";
  if (!profile.avatar_url) profile.avatar_url = "";

  if (linkset.auth_type === "jaas") {
    url = await generateRoomUrlJaas(linkset, profile, affiliation, exp);
  } else if (linkset.auth_type === "token") {
    url = await generateRoomUrlToken(linkset, profile, affiliation, exp);
  } else {
    let roomName = encodeURIComponent(linkset.name);

    url = encodeURI(linkset.domain_attr.url);
    if (linkset.has_suffix) roomName = `${roomName}-${linkset.suffix}`;
    url = `${url}/${roomName}`;
  }

  // Exception for meet.jit.si, it doesn't support fragments correctly.
  // So, use only the link without any fragment.
  if (linkset.domain_attr.url === "https://meet.jit.si") return url;

  const subject = encodeURIComponent(`"${linkset.label || linkset.name}"`);
  const displayName = encodeURIComponent(`"${profile.name}"`);
  const email = encodeURIComponent(`"${profile.email}"`);

  const avatar = encodeURIComponent(`"${toAbsoluteUrl(profile.avatar_url)}"`);

  url = `${url}#config.localSubject=${subject}`;
  if (profile.name) url = `${url}&userInfo.displayName=${displayName}`;
  if (profile.email) url = `${url}&userInfo.email=${email}`;
  if (profile.avatar_url) url = `${url}&userInfo.avatarUrl=${avatar}`;
  if (additionalHash) url = `${url}${additionalHash}`;

  return url;
}

// -----------------------------------------------------------------------------
async function generateMeetingUrlJaasHost(
  linkset: MeetingLinkset,
  exp: number,
): Promise<string> {
  const sub = encodeURIComponent(linkset.domain_attr.jaas_app_id);
  let url = encodeURI(linkset.domain_attr.jaas_url);
  let roomName = encodeURIComponent(linkset.room_name);

  if (linkset.has_suffix) roomName = `${roomName}-${linkset.suffix}`;
  url = `${url}/${sub}/${roomName}`;

  const jwt = await generateHostTokenJaas({
    jaasAppId: linkset.domain_attr.jaas_app_id,
    jaasKid: linkset.domain_attr.jaas_kid,
    jaasKey: linkset.domain_attr.jaas_key,
    jaasAlg: linkset.domain_attr.jaas_alg,
    jaasAud: linkset.domain_attr.jaas_aud,
    jaasIss: linkset.domain_attr.jaas_iss,
    roomName,
    username: linkset.profile_name,
    email: linkset.profile_email,
    exp,
  });

  return `${url}?jwt=${jwt}`;
}

// -----------------------------------------------------------------------------
async function generateMeetingUrlJaasGuest(
  linkset: MeetingLinkset,
  exp: number,
): Promise<string> {
  const sub = encodeURIComponent(linkset.domain_attr.jaas_app_id);
  let url = encodeURI(linkset.domain_attr.jaas_url);
  let roomName = encodeURIComponent(linkset.room_name);

  if (linkset.has_suffix) roomName = `${roomName}-${linkset.suffix}`;
  url = `${url}/${sub}/${roomName}`;

  const jwt = await generateGuestTokenJaas({
    jaasAppId: linkset.domain_attr.jaas_app_id,
    jaasKid: linkset.domain_attr.jaas_kid,
    jaasKey: linkset.domain_attr.jaas_key,
    jaasAlg: linkset.domain_attr.jaas_alg,
    jaasAud: linkset.domain_attr.jaas_aud,
    jaasIss: linkset.domain_attr.jaas_iss,
    roomName,
    username: linkset.profile_name,
    email: linkset.profile_email,
    exp,
  });

  return `${url}?jwt=${jwt}`;
}

// -----------------------------------------------------------------------------
async function generateMeetingUrlTokenHost(
  linkset: MeetingLinkset,
  exp: number,
): Promise<string> {
  let url = encodeURI(linkset.domain_attr.url);
  let roomName = encodeURIComponent(linkset.room_name);

  if (linkset.has_suffix) roomName = `${roomName}-${linkset.suffix}`;
  url = `${url}/${roomName}`;

  const jwt = await generateHostTokenHS({
    appId: linkset.domain_attr.app_id,
    appSecret: linkset.domain_attr.app_secret,
    appAlg: linkset.domain_attr.app_alg,
    roomName,
    username: linkset.profile_name,
    email: linkset.profile_email,
    exp,
    avatar: linkset.profile_avatar_url,
  });

  return `${url}?jwt=${jwt}`;
}

// -----------------------------------------------------------------------------
async function generateMeetingUrlTokenGuest(
  linkset: MeetingLinkset,
  exp: number,
): Promise<string> {
  let url = encodeURI(linkset.domain_attr.url);
  let roomName = encodeURIComponent(linkset.room_name);

  if (linkset.has_suffix) roomName = `${roomName}-${linkset.suffix}`;
  url = `${url}/${roomName}`;

  const jwt = await generateGuestTokenHS({
    appId: linkset.domain_attr.app_id,
    appSecret: linkset.domain_attr.app_secret,
    appAlg: linkset.domain_attr.app_alg,
    roomName,
    username: linkset.profile_name,
    email: linkset.profile_email,
    exp,
    avatar: linkset.profile_avatar_url,
  });

  return `${url}?jwt=${jwt}`;
}

// -----------------------------------------------------------------------------
function normalizeMeetingLinksetProfiles(linkset: MeetingLinkset): void {
  if (!linkset.profile_name) linkset.profile_name = "";
  if (!linkset.profile_email) linkset.profile_email = "";
  if (!linkset.profile_avatar_url) linkset.profile_avatar_url = "";
}

// -----------------------------------------------------------------------------
async function resolveMeetingBaseUrl(
  linkset: MeetingLinkset,
  exp: number,
): Promise<string> {
  if (linkset.auth_type === "jaas" && linkset.join_as === "host") {
    return await generateMeetingUrlJaasHost(linkset, exp);
  } else if (linkset.auth_type === "jaas") {
    return await generateMeetingUrlJaasGuest(linkset, exp);
  } else if (linkset.auth_type === "token" && linkset.join_as === "host") {
    return await generateMeetingUrlTokenHost(linkset, exp);
  } else if (linkset.auth_type === "token") {
    return await generateMeetingUrlTokenGuest(linkset, exp);
  }

  let roomName = encodeURIComponent(linkset.room_name);
  const url = encodeURI(linkset.domain_attr.url);
  if (linkset.has_suffix) roomName = `${roomName}-${linkset.suffix}`;
  return `${url}/${roomName}`;
}

// -----------------------------------------------------------------------------
function buildMeetingFragment(
  linkset: MeetingLinkset,
  additionalHash: string,
): string {
  const subject = linkset.schedule_name
    ? encodeURIComponent(`"${linkset.schedule_name}, ${linkset.name}"`)
    : encodeURIComponent(`"${linkset.name}"`);

  const displayName = encodeURIComponent(`"${linkset.profile_name}"`);
  const email = encodeURIComponent(`"${linkset.profile_email}"`);
  const avatar = encodeURIComponent(
    `"${toAbsoluteUrl(linkset.profile_avatar_url)}"`,
  );

  let fragment = `#config.localSubject=${subject}`;
  if (linkset.profile_name) fragment += `&userInfo.displayName=${displayName}`;
  if (linkset.profile_email) fragment += `&userInfo.email=${email}`;
  if (linkset.profile_avatar_url) fragment += `&userInfo.avatarUrl=${avatar}`;
  if (additionalHash) fragment += additionalHash;

  return fragment;
}

// -----------------------------------------------------------------------------
export async function generateMeetingUrl(
  linkset: MeetingLinkset,
  exp = 3600,
  additionalHash = "",
): Promise<string> {
  normalizeMeetingLinksetProfiles(linkset);

  const url = await resolveMeetingBaseUrl(linkset, exp);

  // Exception for meet.jit.si, it doesn't support fragments correctly.
  // So, use only the link without any fragment.
  if (linkset.domain_attr.url === "https://meet.jit.si") return url;

  return url + buildMeetingFragment(linkset, additionalHash);
}

// -----------------------------------------------------------------------------
// return YYYY-MM-DD
// -----------------------------------------------------------------------------
export function getFirstDayOfMonth(date: string) {
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) throw new Error("invalid date");

  const diff = _date.getDate() - 1;
  const first = new Date(_date.getTime() - diff * 24 * 60 * 60 * 1000);

  return (
    first.getFullYear() +
    "-" +
    ("0" + (first.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + first.getDate()).slice(-2)
  );
}

// -----------------------------------------------------------------------------
// Sunday is assumed as the first day of the week.
// return YYYY-MM-DD
// -----------------------------------------------------------------------------
export function getFirstDayOfWeek(date: string) {
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) throw new Error("invalid date");

  const diff = _date.getDay();
  const sunday = new Date(_date.getTime() - diff * 24 * 60 * 60 * 1000);

  return (
    sunday.getFullYear() +
    "-" +
    ("0" + (sunday.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + sunday.getDate()).slice(-2)
  );
}

// -----------------------------------------------------------------------------
// return YYYY-MM-DD
// -----------------------------------------------------------------------------
export function dateAfterXDays(date: string, days: number) {
  const date0 = new Date(date);
  if (Number.isNaN(date0.getTime())) throw new Error("invalid date");

  const date1 = new Date(date0.getTime() + days * 24 * 60 * 60 * 1000);
  if (Number.isNaN(date1.getTime())) throw new Error("invalid date");

  return (
    date1.getFullYear() +
    "-" +
    ("0" + (date1.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date1.getDate()).slice(-2)
  );
}
