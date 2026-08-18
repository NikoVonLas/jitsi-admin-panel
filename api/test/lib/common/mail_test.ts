import { assertEquals, assertStringIncludes } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { buildMeetingReminderMessage } from "../../../lib/common/mail.ts";

describe("meeting reminder message", () => {
  it("links the owner to the supported moderator join page", () => {
    const message = buildMeetingReminderMessage(
      {
        id: "cbbce245-f626-4f70-ac01-c4f4e58cb26e",
        session_id: "8e641112-b4a4-4209-a903-8cac7475483f",
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
