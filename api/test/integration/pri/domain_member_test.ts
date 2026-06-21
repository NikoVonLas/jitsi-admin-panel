import { assertEquals } from "@std/assert";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeDomain from "../../../lib/pri/domain.ts";
import routeDomainMember from "../../../lib/pri/domain-member.ts";

const EMAIL = "admin@domain-member-test.example";
const PASSWORD = "secure_member_test_pass_123";
const MEMBER_EMAIL = "member@domain-member-test.example";

async function addTestDomain(identityId: string): Promise<string> {
  const req = makeRequest("POST", "/api/pri/domain/add", {
    name: "Member Test Domain",
    auth_type: "none",
    domain_attr: { url: "https://meet.member-test.example" },
    public: false,
  });
  const res = await routeDomain(req, "/api/pri/domain/add", identityId);
  const body = await res.json();
  return body[0].id as string;
}

describe("pri/domain/member", () => {
  let identityId = "";
  let domainId = "";

  beforeAll(async () => {
    await cleanDb();
    const auth = await registerFirst(EMAIL, PASSWORD);
    identityId = auth.identityId;
    domainId = await addTestDomain(identityId);
  });

  afterAll(async () => {
    await cleanDb();
  });

  beforeEach(async () => {
    const { query } = await import("../../../lib/database/common.ts");
    await query({
      text: `DELETE FROM domain_member WHERE domain_id = $1`,
      args: [domainId],
    });
  });

  it("lists domain members (empty initially)", async () => {
    const req = makeRequest("POST", "/api/pri/domain/member/list", {
      domain_id: domainId,
    });
    const res = await routeDomainMember(
      req,
      "/api/pri/domain/member/list",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body.length, 0);
  });

  it("adds a domain member", async () => {
    const req = makeRequest("POST", "/api/pri/domain/member/add", {
      domain_id: domainId,
      email: MEMBER_EMAIL,
    });
    const res = await routeDomainMember(
      req,
      "/api/pri/domain/member/add",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(typeof body[0].id, "string");
  });

  it("lists domain members after add", async () => {
    const addReq = makeRequest("POST", "/api/pri/domain/member/add", {
      domain_id: domainId,
      email: MEMBER_EMAIL,
    });
    await routeDomainMember(
      addReq,
      "/api/pri/domain/member/add",
      identityId,
    );

    const req = makeRequest("POST", "/api/pri/domain/member/list", {
      domain_id: domainId,
    });
    const res = await routeDomainMember(
      req,
      "/api/pri/domain/member/list",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.length, 1);
    assertEquals(body[0].email, MEMBER_EMAIL);
  });

  it("deletes a domain member", async () => {
    const addReq = makeRequest("POST", "/api/pri/domain/member/add", {
      domain_id: domainId,
      email: MEMBER_EMAIL,
    });
    const addRes = await routeDomainMember(
      addReq,
      "/api/pri/domain/member/add",
      identityId,
    );
    const addBody = await addRes.json();
    const memberId = addBody[0].id as string;

    const delReq = makeRequest("POST", "/api/pri/domain/member/del", {
      id: memberId,
    });
    const delRes = await routeDomainMember(
      delReq,
      "/api/pri/domain/member/del",
      identityId,
    );
    assertEquals(delRes.status, 200);

    const listReq = makeRequest("POST", "/api/pri/domain/member/list", {
      domain_id: domainId,
    });
    const listRes = await routeDomainMember(
      listReq,
      "/api/pri/domain/member/list",
      identityId,
    );
    const listBody = await listRes.json();
    assertEquals(listBody.length, 0);
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pri/domain/member/unknown", {});
    const res = await routeDomainMember(
      req,
      "/api/pri/domain/member/unknown",
      identityId,
    );
    assertEquals(res.status, 404);
  });
});
