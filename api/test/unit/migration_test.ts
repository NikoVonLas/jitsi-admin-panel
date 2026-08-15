import { assertEquals, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { bootstrapSchema } from "../../lib/adm/migration.ts";

describe("database schema bootstrap", () => {
  it("does nothing when the metadata table already exists", async () => {
    let initialized = false;

    const changed = await bootstrapSchema({
      hasMetadata: () => Promise.resolve(true),
      initialize: () => {
        initialized = true;
        return Promise.resolve();
      },
    });

    assertEquals(changed, false);
    assertEquals(initialized, false);
  });

  it("initializes an empty database", async () => {
    let initialized = false;

    const changed = await bootstrapSchema({
      hasMetadata: () => Promise.resolve(false),
      initialize: () => {
        initialized = true;
        return Promise.resolve();
      },
    });

    assertEquals(changed, true);
    assertEquals(initialized, true);
  });

  it("propagates initialization errors", async () => {
    await assertRejects(() =>
      bootstrapSchema({
        hasMetadata: () => Promise.resolve(false),
        initialize: () => Promise.reject(new Error("schema failed")),
      })
    );
  });
});
