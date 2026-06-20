import { getIdentityByCalendarToken } from "../database/calendar-token.ts";
import { listSessionForIcal } from "../database/calendar.ts";
import type { MeetingSchedule222 } from "../database/types.ts";

// -----------------------------------------------------------------------------
function toIcalDate(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d+/, "").replace("Z", "Z");
}

// -----------------------------------------------------------------------------
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const result: string[] = [];
  let start = 0;
  let first = true;

  while (start < bytes.length) {
    const maxBytes = first ? 75 : 74; // first line 75, continuations 74 (1 byte for space)
    let end = start + maxBytes;
    if (end >= bytes.length) {
      result.push(
        (first ? "" : " ") + new TextDecoder().decode(bytes.slice(start)),
      );
      break;
    }
    // Don't split multi-byte UTF-8 sequences
    while (end > start && (bytes[end] & 0xc0) === 0x80) end--;
    result.push(
      (first ? "" : " ") + new TextDecoder().decode(bytes.slice(start, end)),
    );
    start = end;
    first = false;
  }

  return result.join("\r\n");
}

// -----------------------------------------------------------------------------
function escapeIcal(text: string): string {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;") // NOSONAR
    .replaceAll(",", "\\,") // NOSONAR
    .replaceAll("\n", "\\n") // NOSONAR
    .replaceAll("\r", "");
}

// -----------------------------------------------------------------------------
function buildIcal(sessions: MeetingSchedule222[]): string {
  const now = toIcalDate(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Galaxy//Jitsi Admin//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const s of sessions) {
    const uid = `${s.started_at}-${s.meeting_id}@jitsi`.replace(
      /[^a-zA-Z0-9@._-]/g,
      "-",
    );
    lines.push(
      "BEGIN:VEVENT",
      foldLine(`UID:${uid}`),
      `DTSTAMP:${now}`,
      `DTSTART:${toIcalDate(s.started_at)}`,
      `DTEND:${toIcalDate(s.ended_at)}`,
      foldLine(`SUMMARY:${escapeIcal(s.meeting_name)}`),
    );
    if (s.meeting_info) {
      lines.push(foldLine(`DESCRIPTION:${escapeIcal(s.meeting_info)}`));
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

// -----------------------------------------------------------------------------
export async function serveIcal(token: string): Promise<Response> {
  const identityId = await getIdentityByCalendarToken(token);
  if (!identityId) {
    return new Response("Not Found", { status: 404 });
  }

  const sessions = await listSessionForIcal(identityId, 2000, 0);
  const ical = buildIcal(sessions);

  return new Response(ical, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="calendar.ics"',
      "Cache-Control": "no-cache",
    },
  });
}
