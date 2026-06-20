import { DB_VERSION, HOSTNAME, PORT_PUBLIC } from "./config.ts";
import { methodNotAllowed, notFound } from "./lib/http/response.ts";
import { getVersion } from "./lib/database/common.ts";
import { serveAvatar } from "./lib/pub/avatar.ts";
import { serveFavicon } from "./lib/pub/favicon.ts";
import { serveLogo } from "./lib/pub/logo.ts";
import { serveIcal } from "./lib/pub/ical.ts";
import hello from "./lib/pub/hello.ts";
import identity from "./lib/pub/identity.ts";
import meeting from "./lib/pub/meeting.ts";
import meetingSchedule from "./lib/pub/meeting-schedule.ts";
import room from "./lib/pub/room.ts";

const PRE = "/api/pub";

// -----------------------------------------------------------------------------
async function route(req: Request, path: string): Promise<Response> {
  if (path === `${PRE}/hello`) {
    return await hello();
  } else if (new RegExp(`^${PRE}/identity/`).exec(path)) {
    return await identity(req, path);
  } else if (new RegExp(`^${PRE}/meeting/schedule/`).exec(path)) {
    return await meetingSchedule(req, path);
  } else if (new RegExp(`^${PRE}/meeting/`).exec(path)) {
    return await meeting(req, path);
  } else if (new RegExp(`^${PRE}/room/`).exec(path)) {
    return await room(req, path);
  } else {
    return notFound();
  }
}

// -----------------------------------------------------------------------------
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === "GET" && path.startsWith("/api/pub/avatar/")) {
    return await serveAvatar(path);
  } else if (req.method === "GET" && path.startsWith("/api/pub/favicon/")) {
    return await serveFavicon(path);
  } else if (req.method === "GET" && path.startsWith("/api/pub/logo/")) {
    return await serveLogo(path);
  } else if (req.method === "GET" && path.startsWith("/api/pub/ical/")) {
    const token = path.slice("/api/pub/ical/".length);
    return await serveIcal(token);
  } else if (req.method === "POST") {
    return await route(req, path);
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

const controller = new AbortController();
const shutdown = () => controller.abort();
Deno.addSignalListener("SIGINT", shutdown);
Deno.addSignalListener("SIGTERM", shutdown);

try {
  // start the API server
  const server = Deno.serve({
    hostname: HOSTNAME,
    port: PORT_PUBLIC,
    signal: controller.signal,
  }, handler);

  // wait the server until the clean shutdown
  await server.finished;
} finally {
  Deno.removeSignalListener("SIGINT", shutdown);
  Deno.removeSignalListener("SIGTERM", shutdown);
}
