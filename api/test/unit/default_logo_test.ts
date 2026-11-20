import { assertEquals } from "@std/assert";
import { installDefaultLogo } from "../../lib/common/default-logo.ts";

Deno.test("installs a fresh SVG and upgrades the active default on restart", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const encoder = new TextEncoder();
    await installDefaultLogo(dir, encoder.encode("first"));
    assertEquals(await Deno.readTextFile(dir + "/logo"), "first");
    assertEquals(await Deno.readTextFile(dir + "/logo.mime"), "image/svg+xml");

    await installDefaultLogo(dir, encoder.encode("second"));
    assertEquals(await Deno.readTextFile(dir + "/logo"), "second");
    assertEquals(await Deno.readTextFile(dir + "/logo_default"), "second");
    assertEquals(
      await Deno.readTextFile(dir + "/logo_default.mime"),
      "image/svg+xml",
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("preserves an uploaded logo and its MIME while updating the reset image", async () => {
  const dir = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(dir + "/logo", "custom");
    await Deno.writeTextFile(dir + "/logo.mime", "image/webp");
    const encoder = new TextEncoder();
    await installDefaultLogo(dir, encoder.encode("first"));
    await installDefaultLogo(dir, encoder.encode("second"));
    assertEquals(await Deno.readTextFile(dir + "/logo"), "custom");
    assertEquals(await Deno.readTextFile(dir + "/logo.mime"), "image/webp");
    assertEquals(await Deno.readTextFile(dir + "/logo_default"), "second");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
