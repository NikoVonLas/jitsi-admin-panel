import { LOGO_DIR } from "../../config.ts";

const CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/svg+xml": "image/svg+xml",
  "image/webp": "image/webp",
};

// -----------------------------------------------------------------------------
export async function serveLogo(_path: string): Promise<Response> {
  try {
    const mime = await Deno.readTextFile(`${LOGO_DIR}/logo.mime`).catch(
      () => "image/png",
    );
    const contentType = CONTENT_TYPES[mime.trim()] || "image/png";
    const data = await Deno.readFile(`${LOGO_DIR}/logo`);

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
