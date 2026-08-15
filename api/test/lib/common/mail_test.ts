import { assertEquals, assertStringIncludes } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { buildMeetingReminderMessage } from "../../../lib/common/mail.ts";

describe("meeting reminder message", () => {
  it("links the owner to the supported moderator join page", () => {
    const message = buildMeetingReminderMessage(
      {
        id: "cbbce245-f626-4f70-ac01-c4f4e58cb26e",
        email: "owner@example.com",
        meeting_name: "Weekly sync",
        started_at: "2026-08-15T12:30:00.000Z",
      },
      "https://panel.example.com/",
    );

    assertEquals(message.to, "owner@example.com");
    assertStringIncludes(message.subject, "Weekly sync");
    assertStringIncludes(
      message.text,
      "https://panel.example.com/jm/cbbce245-f626-4f70-ac01-c4f4e58cb26e",
    );
    assertEquals(message.text.includes("/pri/owner/wait/"), false);
  });
});
