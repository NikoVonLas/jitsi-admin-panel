import { DB_VERSION, HOSTNAME, PORT_PRIVATE } from "./config.ts";
import {
  methodNotAllowed,
  notFound,
  unauthorized,
} from "./lib/http/response.ts";
import { getIdentityId } from "./lib/pri/identity-oidc.ts";
import { getVersion } from "./lib/database/common.ts";
import calendar from "./lib/pri/calendar.ts";
import domain from "./lib/pri/domain.ts";
import domainMember from "./lib/pri/domain-member.ts";
import hello from "./lib/pri/hello.ts";
import identity from "./lib/pri/identity.ts";
import intercom, { streamIntercom } from "./lib/pri/intercom.ts";
import meeting from "./lib/pri/meeting.ts";
import meetingRequest from "./lib/pri/meeting-request.ts";
import meetingSchedule from "./lib/pri/meeting-schedule.ts";
import pref from "./lib/pri/pref.ts";
import profile, {
  initFaviconDefaults,
  initLogoDefaults,
} from "./lib/pri/profile.ts";
import setting from "./lib/pri/setting.ts";
import oidcProvider from "./lib/pri/oidc-provider.ts";
import room from "./lib/pri/room.ts";
import localUser from "./lib/pri/local-user.ts";

const PRE = "/api/pri";

type RouteHandler = (
  req: Request,
  path: string,
  identityId: string,
) => Promise<Response>;

const ROUTE_TABLE: Array<[RegExp, RouteHandler]> = [
  [/^\/api\/pri\/calendar\//, calendar],
  [/^\/api\/pri\/domain\/member\//, domainMember],
  [/^\/api\/pri\/domain\//, domain],
  [/^\/api\/pri\/identity\//, identity],
  [/^\/api\/pri\/intercom\//, intercom],
  [/^\/api\/pri\/meeting\/request\//, meetingRequest],
  [/^\/api\/pri\/meeting\/schedule\//, meetingSchedule],
  [/^\/api\/pri\/meeting\//, meeting],
  [/^\/api\/pri\/pref\//, pref],
  [/^\/api\/pri\/setting\//, setting],
  [/^\/api\/pri\/oidc-provider\//, oidcProvider],
  [/^\/api\/pri\/profile\//, profile],
  [/^\/api\/pri\/room\//, room],
  [/^\/api\/pri\/user\//, localUser],
];

// -----------------------------------------------------------------------------
async function route(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (path === `${PRE}/hello`) {
    return hello(identityId);
  }

  for (const [pattern, handler] of ROUTE_TABLE) {
    if (pattern.exec(path)) {
      return await handler(req, path, identityId);
    }
  }

  return notFound();
}

// -----------------------------------------------------------------------------
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === "GET" && path === `${PRE}/intercom/stream`) {
    const identityId = await getIdentityId(req);
    if (!identityId) return unauthorized();
    return streamIntercom(req, identityId);
  } else if (req.method === "POST") {
    const identityId = await getIdentityId(req);

    if (identityId && typeof identityId === "string") {
      return await route(req, path, identityId);
    } else {
      return unauthorized();
    }
  } else {
    return methodNotAllowed();
  }
}

// -----------------------------------------------------------------------------
const version = await getVersion();

// dont start if the database version doesn't match
if (DB_VERSION !== version) {
  console.error("Unsupported database version");
  Deno.exit(1);
}

// DB is ready — safe to write settings and seed files
await initFaviconDefaults();
await initLogoDefaults();

const controller = new AbortController();
const shutdown = () => controller.abort();
Deno.addSignalListener("SIGINT", shutdown);
Deno.addSignalListener("SIGTERM", shutdown);

try {
  // start the API server
  const server = Deno.serve({
    hostname: HOSTNAME,
    port: PORT_PRIVATE,
    signal: controller.signal,
  }, handler);

  // wait the server until the clean shutdown
  await server.finished;
} finally {
  Deno.removeSignalListener("SIGINT", shutdown);
  Deno.removeSignalListener("SIGTERM", shutdown);
}
