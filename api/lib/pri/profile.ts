import { notFound } from "../http/response.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import { getLimit, getOffset } from "../database/common.ts";
import {
  addProfile,
  delProfile,
  getDefaultProfile,
  getProfile,
  listProfile,
  setDefaultProfile,
  updateProfile,
} from "../database/profile.ts";
import {
  APP_FQDN,
  APP_SCHEME,
  AVATAR_DIR,
  FAVICON_DIR,
  LOGO_DIR,
} from "../../config.ts";
import { upsertSetting } from "../database/setting.ts";

const PRE = "/api/pri/profile";
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const ALLOWED_LOGO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

// Filenames that the favicons library generates (and that we pre-populate with defaults).
const FAVICON_FILENAMES = [
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "favicon.ico",
];
const FAVICON_DEFAULT_SRC =
  new URL("../../favicon_default.png", import.meta.url).pathname;
const LOGO_DEFAULT_SRC =
  new URL("../../logo_default.svg", import.meta.url).pathname;
const LOGO_DEFAULT_MIME = "image/svg+xml";

// -----------------------------------------------------------------------------
export async function initLogoDefaults() {
  try {
    await Deno.mkdir(LOGO_DIR, { recursive: true });
    const data = await Deno.readFile(LOGO_DEFAULT_SRC);

    // always refresh the backup used by resetLogo
    await Deno.writeFile(`${LOGO_DIR}/logo_default`, data);
    await Deno.writeTextFile(
      `${LOGO_DIR}/logo_default.mime`,
      LOGO_DEFAULT_MIME,
    );

    // seed logo file only if it doesn't exist yet
    try {
      await Deno.stat(`${LOGO_DIR}/logo`);
    } catch {
      await Deno.writeFile(`${LOGO_DIR}/logo`, data);
      await Deno.writeTextFile(`${LOGO_DIR}/logo.mime`, LOGO_DEFAULT_MIME);
    }
    // always ensure the DB entry exists (file may exist but DB entry may be missing)
    await upsertSetting("logo_url", "/api/pub/logo/logo");
  } catch (e) {
    console.error("initLogoDefaults failed:", e);
  }
}

// -----------------------------------------------------------------------------
export async function initFaviconDefaults() {
  try {
    await Deno.mkdir(FAVICON_DIR, { recursive: true });
    const data = await Deno.readFile(FAVICON_DEFAULT_SRC);
    for (const name of FAVICON_FILENAMES) {
      const dest = `${FAVICON_DIR}/${name}`;
      try {
        await Deno.stat(dest);
        // file exists — skip
      } catch {
        await Deno.writeFile(dest, data);
      }
    }
    // also ensure favicon_default.png is in FAVICON_DIR for the reset endpoint
    const defaultDest = `${FAVICON_DIR}/favicon_default.png`;
    try {
      await Deno.stat(defaultDest);
    } catch {
      await Deno.writeFile(defaultDest, data);
    }
  } catch (e) {
    console.error("initFaviconDefaults failed:", e);
  }
}

// -----------------------------------------------------------------------------
async function get(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const profileId = pl.id;

  return getProfile(identityId, profileId);
}

// -----------------------------------------------------------------------------
async function getDefault(_req: Request, identityId: string): Promise<unknown> {
  return await getDefaultProfile(identityId);
}

// -----------------------------------------------------------------------------
async function list(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const limit = getLimit(pl.limit);
  const offset = getOffset(pl.offset);

  return listProfile(identityId, limit, offset);
}

// -----------------------------------------------------------------------------
async function add(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const name = pl.name;
  const email = pl.email;

  return addProfile(identityId, name, email);
}

// -----------------------------------------------------------------------------
async function del(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const profileId = pl.id;

  return delProfile(identityId, profileId);
}

// -----------------------------------------------------------------------------
async function update(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const profileId = pl.id;
  const name = pl.name;
  const email = pl.email;
  const avatarUrl = pl.avatar_url || "";

  return updateProfile(identityId, profileId, name, email, avatarUrl);
}

// -----------------------------------------------------------------------------
async function uploadAvatar(
  req: Request,
  identityId: string,
): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return new Response("no file", { status: 400 });
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return new Response("unsupported type", { status: 400 });
    }
    if (file.size > MAX_AVATAR_SIZE) {
      return new Response("file too large", { status: 400 });
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const filename = `${identityId}-${Date.now()}.${ext}`;

    await Deno.mkdir(AVATAR_DIR, { recursive: true });
    const data = new Uint8Array(await file.arrayBuffer());
    await Deno.writeFile(`${AVATAR_DIR}/${filename}`, data);

    const url = `/api/pub/avatar/${filename}`;

    return new Response(JSON.stringify([{ url }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("avatar upload error:", e);
    return new Response("upload failed", { status: 500 });
  }
}

// -----------------------------------------------------------------------------
async function uploadLogo(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return new Response("no file", { status: 400 });
    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      return new Response("unsupported type", { status: 400 });
    }
    if (file.size > MAX_AVATAR_SIZE) {
      return new Response("file too large", { status: 400 });
    }

    await Deno.mkdir(LOGO_DIR, { recursive: true });
    const data = new Uint8Array(await file.arrayBuffer());
    await Deno.writeFile(`${LOGO_DIR}/logo`, data);
    await Deno.writeTextFile(`${LOGO_DIR}/logo.mime`, file.type);

    const url = "/api/pub/logo/logo";
    await upsertSetting("logo_url", url);

    return new Response(JSON.stringify([{ url }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("logo upload error:", e);
    return new Response("upload failed", { status: 500 });
  }
}

// -----------------------------------------------------------------------------
async function resetLogo(_req: Request): Promise<Response> {
  try {
    const data = await Deno.readFile(`${LOGO_DIR}/logo_default`);
    const mime = await Deno.readTextFile(`${LOGO_DIR}/logo_default.mime`).catch(
      () => LOGO_DEFAULT_MIME,
    );
    await Deno.writeFile(`${LOGO_DIR}/logo`, data);
    await Deno.writeTextFile(`${LOGO_DIR}/logo.mime`, mime);
    await upsertSetting("logo_url", "/api/pub/logo/logo");
    return new Response(JSON.stringify([{ ok: true }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("logo reset error:", e);
    return new Response("reset failed", { status: 500 });
  }
}

// -----------------------------------------------------------------------------
const ALLOWED_FAVICON_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);
const MAX_FAVICON_SIZE = 5 * 1024 * 1024;

async function uploadFavicon(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return new Response("no file", { status: 400 });
    if (!ALLOWED_FAVICON_TYPES.has(file.type)) {
      return new Response("unsupported type", { status: 400 });
    }
    if (file.size > MAX_FAVICON_SIZE) {
      return new Response("file too large", { status: 400 });
    }

    const ext = file.type === "image/svg+xml"
      ? "svg"
      : file.type.split("/")[1].replace("jpeg", "jpg");
    const tmpPath = `/tmp/favicon-src-${Date.now()}.${ext}`;

    const data = new Uint8Array(await file.arrayBuffer());
    await Deno.writeFile(tmpPath, data);

    const { favicons } = await import("favicons");
    const basePath = `${APP_SCHEME}://${APP_FQDN}/api/pub/favicon/`;

    const result = await favicons(tmpPath, {
      path: basePath,
      icons: {
        android: false,
        appleIcon: true,
        appleStartup: false,
        favicons: true,
        windows: false,
        yandex: false,
      },
    });

    await Deno.remove(tmpPath).catch(() => {});

    await Deno.mkdir(FAVICON_DIR, { recursive: true });

    for (const img of result.images) {
      await Deno.writeFile(`${FAVICON_DIR}/${img.name}`, img.contents);
    }
    for (const f of result.files) {
      await Deno.writeTextFile(`${FAVICON_DIR}/${f.name}`, f.contents);
    }

    const html = result.html.join("\n");
    await upsertSetting("favicon_html", html);

    return new Response(JSON.stringify([{ html }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("favicon upload error:", e);
    return new Response("upload failed", { status: 500 });
  }
}

// -----------------------------------------------------------------------------
async function resetFavicon(_req: Request): Promise<Response> {
  try {
    const data = await Deno.readFile(`${FAVICON_DIR}/favicon_default.png`);
    for (const name of FAVICON_FILENAMES) {
      await Deno.writeFile(`${FAVICON_DIR}/${name}`, data);
    }
    await upsertSetting("favicon_html", "");
    return new Response(JSON.stringify([{ ok: true }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("favicon reset error:", e);
    return new Response("reset failed", { status: 500 });
  }
}

// -----------------------------------------------------------------------------
async function setDefault(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const profileId = pl.id;

  return setDefaultProfile(identityId, profileId);
}

// -----------------------------------------------------------------------------
export default function routeProfile(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (path === `${PRE}/get`) {
    return wrapper(get, req, identityId);
  } else if (path === `${PRE}/get/default`) {
    return wrapper(getDefault, req, identityId);
  } else if (path === `${PRE}/list`) {
    return wrapper(list, req, identityId);
  } else if (path === `${PRE}/add`) {
    return wrapper(add, req, identityId);
  } else if (path === `${PRE}/del`) {
    return wrapper(del, req, identityId);
  } else if (path === `${PRE}/update`) {
    return wrapper(update, req, identityId);
  } else if (path === `${PRE}/set/default`) {
    return wrapper(setDefault, req, identityId);
  } else if (path === `${PRE}/avatar/upload`) {
    return uploadAvatar(req, identityId);
  } else if (path === `${PRE}/logo/upload`) {
    return uploadLogo(req);
  } else if (path === `${PRE}/logo/reset`) {
    return resetLogo(req);
  } else if (path === `${PRE}/favicon/upload`) {
    return uploadFavicon(req);
  } else if (path === `${PRE}/favicon/reset`) {
    return resetFavicon(req);
  } else {
    return notFound();
  }
}
