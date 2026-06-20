import { HOSTNAME, PORT_ADMIN } from "./config.ts";
import {
  methodNotAllowed,
  notFound,
  unauthorized,
} from "./lib/http/response.ts";
import { getIdentityId } from "./lib/pri/identity-oidc.ts";
import { getIdentityRole } from "./lib/database/identity.ts";
import { Timers } from "./lib/adm/types.ts";
import migrate from "./lib/adm/migration.ts";
import doit from "./lib/adm/housekeeping.ts";
import cronjob from "./lib/adm/cronjob.ts";
import hello from "./lib/adm/hello.ts";
import config from "./lib/adm/config-oidc.ts";
import setting from "./lib/adm/setting.ts";
import identity from "./lib/adm/identity-oidc.ts";
import oidcAuth from "./lib/adm/oidc-auth.ts";
import oidcLogout from "./lib/adm/oidc-logout.ts";
import oidcRedirect from "./lib/adm/oidc-redirect.ts";
import authConfig from "./lib/adm/auth-config.ts";
import localLogin from "./lib/adm/local-login.ts";
import localRegister from "./lib/adm/local-register.ts";
import oidcProvider from "./lib/adm/oidc-provider.ts";

const PRE = "/api/adm";

const timers = {} as Timers;

// -----------------------------------------------------------------------------
async function migration() {
  try {
    await migrate();

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// -----------------------------------------------------------------------------
async function housekeeping(t: Timers, signal: AbortSignal) {
  if (signal.aborted) return;

  try {
    await doit();
  } catch {
    // do nothing
  }

  if (signal.aborted) return;

  // rerun in 10 min
  t.housekeeping = setTimeout(() => housekeeping(t, signal), 10 * 60 * 1000);
}

// -----------------------------------------------------------------------------
async function route(req: Request, path: string): Promise<Response> {
  if (path === `${PRE}/hello`) {
    return hello();
  } else if (path === `${PRE}/config`) {
    return await config();
  } else if (new RegExp(`^${PRE}/setting/`).exec(path)) {
    return await setting(req, path);
  } else if (new RegExp(`^${PRE}/identity/`).exec(path)) {
    return await identity(req, path);
  } else if (path === `${PRE}/oidc/auth-url`) {
    return await oidcAuth(req);
  } else if (path === `${PRE}/oidc/logout-url`) {
    return await oidcLogout();
  } else {
    return notFound();
  }
}

// -----------------------------------------------------------------------------
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === "GET" && path === `${PRE}/oidc/redirect`) {
    return await oidcRedirect(req);
  }

  // Public: auth config (no token needed)
  if (req.method === "GET" && path === `${PRE}/auth/config`) {
    return authConfig();
  }

  // Local auth
  if (req.method === "POST" && path === `${PRE}/auth/local/login`) {
    return await localLogin(req);
  }
  if (req.method === "POST" && path === `${PRE}/auth/local/register`) {
    return await localRegister(req);
  }

  // OIDC providers CRUD (superadmin only, handled inside wrapper)
  // All routes below require a valid session + superadmin
  const identityId = await getIdentityId(req);
  if (!identityId) return unauthorized();
  const roleRows = await getIdentityRole(identityId);
  if (!roleRows[0]?.is_superadmin) return unauthorized();

  if (path.startsWith(`${PRE}/oidc-provider/`)) {
    return await oidcProvider(req, path);
  }

  if (req.method === "POST") {
    return await route(req, path);
  }

  return methodNotAllowed();
}

// -----------------------------------------------------------------------------
// ensure database schema is up-to-date before starting
const isMigrated = await migration();
if (!isMigrated) Deno.exit(1);

const controller = new AbortController();
const shutdown = () => {
  controller.abort();
  clearTimeout(timers.housekeeping);
  clearTimeout(timers.cronjobRemindMeetingSession);
};
Deno.addSignalListener("SIGINT", shutdown);
Deno.addSignalListener("SIGTERM", shutdown);

try {
  // start the cronjob cycle
  cronjob(timers, controller.signal);

  // start the API server
  const server = Deno.serve({
    hostname: HOSTNAME,
    port: PORT_ADMIN,
    signal: controller.signal,
  }, handler);

  // run server and housekeeping concurrently; both stop on signal
  await Promise.all([
    server.finished,
    housekeeping(timers, controller.signal),
  ]);
} finally {
  Deno.removeSignalListener("SIGINT", shutdown);
  Deno.removeSignalListener("SIGTERM", shutdown);
}
