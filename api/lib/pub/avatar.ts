import { AVATAR_DIR } from "../../config.ts";

const CONTENT_TYPES: Record<string, string> = {
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "png": "image/png",
  "gif": "image/gif",
  "webp": "image/webp",
};

// -----------------------------------------------------------------------------
export async function serveAvatar(path: string): Promise<Response> {
  // Extract filename, e.g. /api/pub/avatar/abc123.png -> abc123.png
  const filename = path.split("/").pop() || "";

  // Reject anything with path traversal or unusual chars
  if (!filename || !/^[\w-]+\.\w+$/.test(filename)) {
    return new Response("Not Found", { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

  try {
    const data = await Deno.readFile(`${AVATAR_DIR}/${filename}`);

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
