import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { isValidUrl } from "../../../lib/common/validate.ts";

describe("isValidUrl", () => {
  it("accepts http URLs", () => {
    assertEquals(isValidUrl("http://example.com"), true);
  });

  it("accepts https URLs", () => {
    assertEquals(isValidUrl("https://example.com"), true);
  });

  it("accepts URLs with port", () => {
    assertEquals(isValidUrl("https://example.com:8080"), true);
  });

  it("accepts URLs with path", () => {
    assertEquals(isValidUrl("https://example.com/path/to"), true);
  });

  it("accepts IP-like hostnames", () => {
    assertEquals(isValidUrl("http://192.168.1.1:7745"), true);
  });

  it("accepts subdomain URLs", () => {
    assertEquals(isValidUrl("https://meet.example.com"), true);
  });

  it("rejects empty string", () => {
    assertEquals(isValidUrl(""), false);
  });

  it("rejects plain hostname without scheme", () => {
    assertEquals(isValidUrl("example.com"), false);
  });

  it("rejects ftp scheme", () => {
    assertEquals(isValidUrl("ftp://example.com"), false);
  });

  it("rejects URL with spaces", () => {
    assertEquals(isValidUrl("https://exa mple.com"), false);
  });

  it("rejects URL without hostname", () => {
    assertEquals(isValidUrl("https://"), false);
  });

  it("accepts meet.jit.si", () => {
    assertEquals(isValidUrl("https://meet.jit.si"), true);
  });

  it("accepts 8x8.vc (JaaS default)", () => {
    assertEquals(isValidUrl("https://8x8.vc"), true);
  });
});
