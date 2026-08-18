import { mailMeetingSession } from "../common/mail.ts";
import {
  listMeetingSessionForReminder,
  markMeetingSessionReminderSent,
} from "../database/meeting-session.ts";
import type { MeetingSessionForReminder } from "../database/types.ts";
import { Timers } from "./types.ts";

interface ReminderDependencies {
  list: () => Promise<MeetingSessionForReminder[]>;
  mail: (row: MeetingSessionForReminder) => Promise<boolean>;
  markSent: (sessionId: string) => Promise<unknown>;
}

const reminderDependencies: ReminderDependencies = {
  list: listMeetingSessionForReminder,
  mail: mailMeetingSession,
  markSent: markMeetingSessionReminderSent,
};

// -----------------------------------------------------------------------------
export async function runReminderCycle(
  signal: AbortSignal,
  dependencies = reminderDependencies,
) {
  if (signal.aborted) return;

  const rows = await dependencies.list();
  for (const row of rows) {
    if (signal.aborted) break;

    try {
      const sent = await dependencies.mail(row);
      if (sent) await dependencies.markSent(row.session_id);
    } catch (e) {
      console.error(e);
    }
  }
}

// -----------------------------------------------------------------------------
// Run every 30 seconds.
async function remindMeetingSession(t: Timers, signal: AbortSignal) {
  try {
    await runReminderCycle(signal);
  } catch (e) {
    console.error(e);
  }

  if (signal.aborted) return;

  t.cronjobRemindMeetingSession = setTimeout(
    () => remindMeetingSession(t, signal),
    30 * 1000,
  );
}

// -----------------------------------------------------------------------------
export default function startCronjob(t: Timers, signal: AbortSignal) {
  console.log("cronjob is started");

  // Don't wait for async functions; each function has its own cycle.
  remindMeetingSession(t, signal);
}
