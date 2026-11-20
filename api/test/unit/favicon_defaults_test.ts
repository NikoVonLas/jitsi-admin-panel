import { assertEquals } from "@std/assert";
import { initFaviconDefaults } from "../../lib/pri/profile.ts";

Deno.test("favicon defaults fill missing files and preserve an uploaded icon", async () => {
  const directory = await Deno.makeTempDir();
  try {
    const custom = new Uint8Array([7, 8]);
    await Deno.writeFile(directory + "/favicon.ico", custom);
    await initFaviconDefaults(directory);
    const original = await Deno.readFile(directory + "/favicon_default.png");
    assertEquals(original.length > 0, true);
    for (
      const name of [
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
      ]
    ) {
      assertEquals(await Deno.readFile(directory + "/" + name), original);
    }
    assertEquals(await Deno.readFile(directory + "/favicon.ico"), custom);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});
