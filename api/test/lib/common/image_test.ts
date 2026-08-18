import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { hasImageSignature } from "../../../lib/common/image.ts";

describe("hasImageSignature", () => {
  it("recognizes supported raster signatures", () => {
    assertEquals(
      hasImageSignature(new Uint8Array([0xff, 0xd8, 0xff, 0x00]), "image/jpeg"),
      true,
    );
    assertEquals(
      hasImageSignature(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        "image/png",
      ),
      true,
    );
    assertEquals(
      hasImageSignature(
        new TextEncoder().encode("GIF89a"),
        "image/gif",
      ),
      true,
    );
    assertEquals(
      hasImageSignature(
        new Uint8Array([
          0x52,
          0x49,
          0x46,
          0x46,
          0,
          0,
          0,
          0,
          0x57,
          0x45,
          0x42,
          0x50,
        ]),
        "image/webp",
      ),
      true,
    );
  });

  it("rejects a spoofed MIME type and SVG", () => {
    const html = new TextEncoder().encode("<script>alert(1)</script>");
    assertEquals(hasImageSignature(html, "image/png"), false);
    assertEquals(hasImageSignature(html, "image/svg+xml"), false);
  });
});
