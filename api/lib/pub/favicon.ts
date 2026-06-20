import { FAVICON_DIR } from "../../config.ts";

const CONTENT_TYPES: Record<string, string> = {
  "ico": "image/x-icon",
  "png": "image/png",
  "svg": "image/svg+xml",
  "webp": "image/webp",
  "json": "application/json",
  "webmanifest": "application/manifest+json",
  "xml": "application/xml",
};

// -----------------------------------------------------------------------------
export async function serveFavicon(path: string): Promise<Response> {
  const filename = path.split("/").pop() || "";

  if (!filename || !/^[\w-]+\.\w+$/.test(filename)) {
    return new Response("Not Found", { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

  try {
    const data = await Deno.readFile(`${FAVICON_DIR}/${filename}`);

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
