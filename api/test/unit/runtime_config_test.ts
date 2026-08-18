import { assertEquals, assertThrows } from "@std/assert";
import { validateRuntimeConfig } from "../../lib/common/runtime-config.ts";

const validEnv = {
  DB_PASSWD: "database-secret",
  API_SECRET: "0123456789abcdef0123456789abcdef",
  APP_FQDN: "panel.example.com",
  APP_SCHEME: "https",
  SESSION_COOKIE_SECURE: "true",
};

Deno.test("runtime config accepts valid service-specific settings", () => {
  validateRuntimeConfig("adm", validEnv);
  validateRuntimeConfig("pri", validEnv);
  validateRuntimeConfig("pub", { DB_PASSWD: "database-secret" });
});

Deno.test("runtime config requires database credentials for every API", () => {
  for (const service of ["adm", "pri", "pub"] as const) {
    assertThrows(
      () => validateRuntimeConfig(service, {}),
      Error,
      `${service}: DB_PASSWD must be set`,
    );
  }
});

Deno.test("runtime config rejects weak shared API secrets", () => {
  assertThrows(
    () => validateRuntimeConfig("pri", { ...validEnv, API_SECRET: "short" }),
    Error,
    "API_SECRET must contain at least 32 characters",
  );
});

Deno.test("runtime config validates public URL and cookie security", () => {
  assertThrows(
    () =>
      validateRuntimeConfig("adm", {
        ...validEnv,
        APP_FQDN: "https://panel.example.com",
      }),
    Error,
    "APP_FQDN must not include a URL scheme",
  );
  assertThrows(
    () => validateRuntimeConfig("pri", { ...validEnv, APP_FQDN: ":80" }),
    Error,
    "APP_FQDN must be a hostname with an optional port",
  );
  assertThrows(
    () =>
      validateRuntimeConfig("adm", {
        ...validEnv,
        SESSION_COOKIE_SECURE: "false",
      }),
    Error,
    "SESSION_COOKIE_SECURE must be true for https and false for http",
  );
  assertThrows(
    () =>
      validateRuntimeConfig("adm", {
        ...validEnv,
        APP_SCHEME: "http",
        SESSION_COOKIE_SECURE: "true",
      }),
    Error,
    "SESSION_COOKIE_SECURE must be true for https and false for http",
  );
  assertThrows(
    () =>
      validateRuntimeConfig("adm", {
        ...validEnv,
        SESSION_COOKIE_SECURE: "sometimes",
      }),
    Error,
    "SESSION_COOKIE_SECURE must be true or false",
  );
});

Deno.test("runtime config validates numeric settings", () => {
  assertThrows(
    () => validateRuntimeConfig("pub", { DB_PASSWD: "secret", DB_PORT: "0" }),
    Error,
    "DB_PORT must be a positive integer",
  );
  assertThrows(
    () => validateRuntimeConfig("adm", { ...validEnv, API_TIMEOUT: "NaN" }),
    Error,
    "API_TIMEOUT must be a positive integer",
  );
  assertEquals(
    (() => {
      validateRuntimeConfig("pri", { ...validEnv, DB_POOL_SIZE: "1" });
      return true;
    })(),
    true,
  );
});
