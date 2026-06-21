import { assertEquals, assertStringIncludes } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  generateMeetingUrl,
  generateRoomUrl,
} from "../../lib/common/helper.ts";
import type { MeetingLinkset, RoomLinkset } from "../../lib/database/types.ts";

// Shared linkset factory helpers
function makeRoomLinkset(overrides: Partial<RoomLinkset> = {}): RoomLinkset {
  return {
    name: "test-room",
    label: "Test Room",
    has_suffix: false,
    suffix: "",
    auth_type: "none",
    domain_attr: {
      url: "https://meet.example.com",
      app_id: "",
      app_secret: "",
      app_alg: "",
    },
    ...overrides,
  };
}

const EMPTY_PROFILE = {
  id: "",
  name: "",
  email: "",
  avatar_url: "",
  is_default: false,
  created_at: "",
  updated_at: "",
};

function makeProfile(overrides: Partial<typeof EMPTY_PROFILE> = {}) {
  return { ...EMPTY_PROFILE, ...overrides };
}

function makeMeetingLinkset(
  overrides: Partial<MeetingLinkset> = {},
): MeetingLinkset {
  return {
    id: "m1",
    name: "Test Meeting",
    room_name: "test-room",
    schedule_name: "",
    has_suffix: false,
    suffix: "",
    auth_type: "none",
    domain_attr: {
      url: "https://meet.example.com",
      app_id: "",
      app_secret: "",
      app_alg: "",
    },
    join_as: "host",
    started_at: "",
    ended_at: "",
    duration: 60,
    remaining: 3600,
    profile_name: "",
    profile_email: "",
    profile_avatar_url: "",
    ...overrides,
  };
}

// =============================================================================
describe("generateRoomUrl — auth_type: none", () => {
  it("builds basic URL for none auth", async () => {
    const url = await generateRoomUrl(makeRoomLinkset(), EMPTY_PROFILE);
    assertStringIncludes(url, "https://meet.example.com/test-room");
  });

  it("includes subject fragment", async () => {
    const url = await generateRoomUrl(makeRoomLinkset(), EMPTY_PROFILE);
    assertStringIncludes(url, "config.localSubject");
  });

  it("appends displayName when profile.name is set", async () => {
    const url = await generateRoomUrl(
      makeRoomLinkset(),
      makeProfile({ name: "Alice" }),
    );
    assertStringIncludes(url, "userInfo.displayName");
  });

  it("appends email when profile.email is set", async () => {
    const url = await generateRoomUrl(
      makeRoomLinkset(),
      makeProfile({ email: "alice@example.com" }),
    );
    assertStringIncludes(url, "userInfo.email");
  });

  it("appends avatarUrl when profile.avatar_url is set", async () => {
    const url = await generateRoomUrl(
      makeRoomLinkset(),
      makeProfile({ avatar_url: "https://example.com/av.png" }),
    );
    assertStringIncludes(url, "userInfo.avatarUrl");
  });

  it("omits displayName when profile.name is empty", async () => {
    const url = await generateRoomUrl(makeRoomLinkset(), EMPTY_PROFILE);
    assertEquals(url.includes("userInfo.displayName"), false);
  });

  it("appends suffix when has_suffix is true", async () => {
    const url = await generateRoomUrl(
      makeRoomLinkset({ has_suffix: true, suffix: "abc123" }),
      EMPTY_PROFILE,
    );
    assertStringIncludes(url, "test-room-abc123");
  });

  it("passes additionalHash through", async () => {
    const url = await generateRoomUrl(
      makeRoomLinkset(),
      EMPTY_PROFILE,
      "host",
      3600,
      "&config.startWithAudioMuted=true",
    );
    assertStringIncludes(url, "config.startWithAudioMuted=true");
  });

  it("returns bare URL for meet.jit.si (no fragment)", async () => {
    const linkset = makeRoomLinkset({
      domain_attr: {
        url: "https://meet.jit.si",
        app_id: "",
        app_secret: "",
        app_alg: "",
      },
    });
    const url = await generateRoomUrl(linkset, EMPTY_PROFILE);
    assertEquals(url.includes("#"), false);
    assertStringIncludes(url, "meet.jit.si/test-room");
  });

  it("uses label in subject when label is set", async () => {
    const url = await generateRoomUrl(
      makeRoomLinkset({ label: "My Test Room" }),
      EMPTY_PROFILE,
    );
    assertStringIncludes(url, "My%20Test%20Room");
  });
});

// =============================================================================
describe("generateRoomUrl — auth_type: token", () => {
  const tokenLinkset = makeRoomLinkset({
    auth_type: "token",
    domain_attr: {
      url: "https://meet.example.com",
      app_id: "my-app",
      app_secret: "super-secret-key-for-testing-hs256",
      app_alg: "HS256",
    },
  });

  it("returns URL with jwt query param for host", async () => {
    const url = await generateRoomUrl(
      tokenLinkset,
      makeProfile({ name: "Bob", email: "bob@example.com" }),
      "host",
    );
    assertStringIncludes(url, "?jwt=");
    assertStringIncludes(url, "test-room");
  });

  it("returns URL with jwt query param for guest", async () => {
    const url = await generateRoomUrl(
      tokenLinkset,
      makeProfile({ name: "Carol", email: "carol@example.com" }),
      "guest",
    );
    assertStringIncludes(url, "?jwt=");
  });

  it("appends suffix when has_suffix is true", async () => {
    const url = await generateRoomUrl(
      { ...tokenLinkset, has_suffix: true, suffix: "xyz" },
      EMPTY_PROFILE,
      "host",
    );
    assertStringIncludes(url, "test-room-xyz");
  });

  it("uses HS512 alg when configured", async () => {
    const linkset = {
      ...tokenLinkset,
      domain_attr: { ...tokenLinkset.domain_attr, app_alg: "HS512" },
    };
    const url = await generateRoomUrl(linkset, EMPTY_PROFILE, "host");
    assertStringIncludes(url, "?jwt=");
  });
});

// =============================================================================
describe("generateMeetingUrl — auth_type: none", () => {
  it("builds basic meeting URL", async () => {
    const url = await generateMeetingUrl(makeMeetingLinkset());
    assertStringIncludes(url, "https://meet.example.com/test-room");
  });

  it("includes subject fragment", async () => {
    const url = await generateMeetingUrl(makeMeetingLinkset());
    assertStringIncludes(url, "config.localSubject");
  });

  it("includes schedule_name in subject when set", async () => {
    const url = await generateMeetingUrl(
      makeMeetingLinkset({ schedule_name: "Weekly Standup" }),
    );
    assertStringIncludes(url, "Weekly%20Standup");
  });

  it("includes displayName when profile_name is set", async () => {
    const url = await generateMeetingUrl(
      makeMeetingLinkset({ profile_name: "Dave" }),
    );
    assertStringIncludes(url, "userInfo.displayName");
  });

  it("includes email when profile_email is set", async () => {
    const url = await generateMeetingUrl(
      makeMeetingLinkset({ profile_email: "dave@example.com" }),
    );
    assertStringIncludes(url, "userInfo.email");
  });

  it("includes avatarUrl when profile_avatar_url is set", async () => {
    const url = await generateMeetingUrl(
      makeMeetingLinkset({ profile_avatar_url: "https://example.com/av.png" }),
    );
    assertStringIncludes(url, "userInfo.avatarUrl");
  });

  it("appends suffix to room name when has_suffix is true", async () => {
    const url = await generateMeetingUrl(
      makeMeetingLinkset({ has_suffix: true, suffix: "abc" }),
    );
    assertStringIncludes(url, "test-room-abc");
  });

  it("passes additionalHash through", async () => {
    const url = await generateMeetingUrl(
      makeMeetingLinkset(),
      3600,
      "&config.startWithVideoMuted=true",
    );
    assertStringIncludes(url, "config.startWithVideoMuted=true");
  });

  it("returns bare URL for meet.jit.si (no fragment)", async () => {
    const linkset = makeMeetingLinkset({
      domain_attr: {
        url: "https://meet.jit.si",
        app_id: "",
        app_secret: "",
        app_alg: "",
      },
    });
    const url = await generateMeetingUrl(linkset);
    assertEquals(url.includes("#"), false);
  });

  it("normalizes null-like profile fields to empty string", async () => {
    const linkset = makeMeetingLinkset({
      profile_name: undefined as unknown as string,
      profile_email: undefined as unknown as string,
      profile_avatar_url: undefined as unknown as string,
    });
    const url = await generateMeetingUrl(linkset);
    assertStringIncludes(url, "test-room");
  });
});

// =============================================================================
describe("generateMeetingUrl — auth_type: token", () => {
  const tokenLinkset = makeMeetingLinkset({
    auth_type: "token",
    profile_name: "Eve",
    profile_email: "eve@example.com",
    join_as: "host",
    domain_attr: {
      url: "https://meet.example.com",
      app_id: "my-app",
      app_secret: "super-secret-key-for-testing-hs256",
      app_alg: "HS256",
    },
  });

  it("returns URL with jwt param for host", async () => {
    const url = await generateMeetingUrl(tokenLinkset);
    assertStringIncludes(url, "?jwt=");
  });

  it("returns URL with jwt param for guest", async () => {
    const url = await generateMeetingUrl({ ...tokenLinkset, join_as: "guest" });
    assertStringIncludes(url, "?jwt=");
  });

  it("appends suffix when has_suffix is true", async () => {
    const url = await generateMeetingUrl({
      ...tokenLinkset,
      has_suffix: true,
      suffix: "xyz",
    });
    assertStringIncludes(url, "test-room-xyz");
  });
});
