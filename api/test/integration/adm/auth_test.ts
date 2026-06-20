import { assertEquals, assertMatch } from "@std/assert";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import handleLocalRegister from "../../../lib/adm/local-register.ts";
import handleLocalLogin from "../../../lib/adm/local-login.ts";

const EMAIL = "admin@test.example";
const PASSWORD = "a_very_secure_password_123!";

async function registerUser(
  email = EMAIL,
  password = PASSWORD,
): Promise<Response> {
  const req = makeRequest("POST", "/api/adm/auth/local/register", {
    email,
    password,
    name: "Test Admin",
  });
  return await handleLocalRegister(req);
}

describe("POST /api/adm/auth/local/register", () => {
  beforeAll(async () => {
    await cleanDb();
  });

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("registers first user and returns a token", async () => {
    const res = await registerUser();
    assertEquals(res.status, 200);
    const body = await res.json();
    assertMatch(
      body.token,
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    );
  });

  it("sets token httpOnly cookie", async () => {
    const res = await registerUser();
    const setCookie = res.headers.get("set-cookie");
    assertEquals(typeof setCookie, "string");
    assertEquals(setCookie?.includes("token="), true);
    assertEquals(setCookie?.includes("HttpOnly"), true);
  });

  it("rejects second registration (setup mode only)", async () => {
    // First user registers OK
    await registerUser();
    // Second attempt should be rejected
    const res2 = await registerUser("second@test.example", PASSWORD);
    assertEquals(res2.status, 401);
  });

  it("rejects short password (< 14 chars)", async () => {
    const res = await makeRequest("POST", "/api/adm/auth/local/register", {
      email: "user@test.example",
      password: "short",
    }).then((r) => handleLocalRegister(r as unknown as Request));
    assertEquals(res.status, 401);
  });

  it("rejects missing email", async () => {
    const req = makeRequest("POST", "/api/adm/auth/local/register", {
      email: "",
      password: PASSWORD,
    });
    const res = await handleLocalRegister(req);
    assertEquals(res.status, 401);
  });

  it("rejects missing password", async () => {
    const req = makeRequest("POST", "/api/adm/auth/local/register", {
      email: EMAIL,
      password: "",
    });
    const res = await handleLocalRegister(req);
    assertEquals(res.status, 401);
  });
});

describe("POST /api/adm/auth/local/login", () => {
  beforeAll(async () => {
    await cleanDb();
    // Ensure a user exists for login tests
    await registerUser();
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("logs in with correct credentials", async () => {
    const req = makeRequest("POST", "/api/adm/auth/local/login", {
      email: EMAIL,
      password: PASSWORD,
    });
    const res = await handleLocalLogin(req);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertMatch(
      body.token,
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    );
  });

  it("returns 401 for wrong password", async () => {
    const req = makeRequest("POST", "/api/adm/auth/local/login", {
      email: EMAIL,
      password: "wrong_password_123!",
    });
    const res = await handleLocalLogin(req);
    assertEquals(res.status, 401);
  });

  it("returns 401 for unknown email", async () => {
    const req = makeRequest("POST", "/api/adm/auth/local/login", {
      email: "nobody@test.example",
      password: PASSWORD,
    });
    const res = await handleLocalLogin(req);
    assertEquals(res.status, 401);
  });

  it("is case-insensitive for email", async () => {
    const req = makeRequest("POST", "/api/adm/auth/local/login", {
      email: EMAIL.toUpperCase(),
      password: PASSWORD,
    });
    const res = await handleLocalLogin(req);
    assertEquals(res.status, 200);
  });

  it("returns 401 for empty credentials", async () => {
    const req = makeRequest("POST", "/api/adm/auth/local/login", {
      email: "",
      password: "",
    });
    const res = await handleLocalLogin(req);
    assertEquals(res.status, 401);
  });

  it("sets token cookie on success", async () => {
    const req = makeRequest("POST", "/api/adm/auth/local/login", {
      email: EMAIL,
      password: PASSWORD,
    });
    const res = await handleLocalLogin(req);
    const setCookie = res.headers.get("set-cookie");
    assertEquals(setCookie?.includes("token="), true);
  });
});
