import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { runReminderCycle } from "../../lib/adm/cronjob.ts";
import type { MeetingSessionForReminder } from "../../lib/database/types.ts";

function reminder(sessionId: string): MeetingSessionForReminder {
  return {
    id: "10000000-0000-0000-0000-000000000001",
    session_id: sessionId,
    email: "owner@example.com",
    meeting_name: "Weekly sync",
    started_at: "2026-08-18T12:00:00.000Z",
  };
}

describe("meeting reminder cycle", () => {
  it("marks a session only after the message is sent", async () => {
    const calls: string[] = [];
    const row = reminder("20000000-0000-0000-0000-000000000001");

    await runReminderCycle(new AbortController().signal, {
      list: () => Promise.resolve([row]),
      mail: (item) => {
        calls.push(`mail:${item.session_id}`);
        return Promise.resolve(true);
      },
      markSent: (sessionId) => {
        calls.push(`mark:${sessionId}`);
        return Promise.resolve();
      },
    });

    assertEquals(calls, [
      `mail:${row.session_id}`,
      `mark:${row.session_id}`,
    ]);
  });

  it("leaves a failed message unmarked so the next cycle retries it", async () => {
    const marked: string[] = [];
    const row = reminder("20000000-0000-0000-0000-000000000002");

    await runReminderCycle(new AbortController().signal, {
      list: () => Promise.resolve([row]),
      mail: () => Promise.resolve(false),
      markSent: (sessionId) => {
        marked.push(sessionId);
        return Promise.resolve();
      },
    });

    assertEquals(marked, []);
  });

  it("does not query or send after cancellation", async () => {
    const controller = new AbortController();
    controller.abort();
    let listed = false;

    await runReminderCycle(controller.signal, {
      list: () => {
        listed = true;
        return Promise.resolve([reminder("unused")]);
      },
      mail: () => Promise.resolve(true),
      markSent: () => Promise.resolve(),
    });

    assertEquals(listed, false);
  });
});
