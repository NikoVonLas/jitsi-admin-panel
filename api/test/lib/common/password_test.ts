import { assertEquals, assertNotEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { hashPassword, verifyPassword } from "../../../lib/common/password.ts";

describe("hashPassword", () => {
  it("returns a non-empty string", async () => {
    const hash = await hashPassword("test_password");
    assertNotEquals(hash, "");
  });

  it("returns salt:hash format", async () => {
    const hash = await hashPassword("test_password");
    const parts = hash.split(":");
    assertEquals(parts.length, 2);
    assertNotEquals(parts[0], "");
    assertNotEquals(parts[1], "");
  });

  it("returns different hashes for same password (random salt)", async () => {
    const hash1 = await hashPassword("same_password");
    const hash2 = await hashPassword("same_password");
    assertNotEquals(hash1, hash2);
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const password = "my_secure_password_123";
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    assertEquals(result, true);
  });

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("correct_password");
    const result = await verifyPassword("wrong_password", hash);
    assertEquals(result, false);
  });

  it("returns false for empty password", async () => {
    const hash = await hashPassword("correct_password");
    const result = await verifyPassword("", hash);
    assertEquals(result, false);
  });

  it("is case-sensitive", async () => {
    const hash = await hashPassword("Password123");
    const result = await verifyPassword("password123", hash);
    assertEquals(result, false);
  });

  it("handles unicode passwords", async () => {
    const password = "пароль_тест_123";
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    assertEquals(result, true);
  });

  it("handles long passwords", async () => {
    const password = "a".repeat(200);
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    assertEquals(result, true);
  });
});
