import { APP_FQDN } from "../../config.ts";
import { MAILER_FROM, MAILER_TRANSPORT_OPTIONS } from "../../config.mailer.ts";
import { getSettingValue } from "../database/setting.ts";
import { createTransport } from "nodemailer";
import type { MeetingSessionForReminder } from "../database/types.ts";

// -----------------------------------------------------------------------------
async function getMailerConfig() {
  try {
    const host = await getSettingValue("mailer_host") ||
      MAILER_TRANSPORT_OPTIONS.host;
    const port = Number(await getSettingValue("mailer_port")) ||
      MAILER_TRANSPORT_OPTIONS.port;
    const secure = (await getSettingValue("mailer_secure") || "true") !==
      "false";
    const user = await getSettingValue("mailer_user") ||
      MAILER_TRANSPORT_OPTIONS.auth.user;
    const pass = await getSettingValue("mailer_pass") ||
      MAILER_TRANSPORT_OPTIONS.auth.pass;
    const from = await getSettingValue("mailer_from") || MAILER_FROM;

    return {
      transport: { host, port, secure, auth: { user, pass } },
      from,
    };
  } catch {
    return {
      transport: MAILER_TRANSPORT_OPTIONS,
      from: MAILER_FROM,
    };
  }
}

// -----------------------------------------------------------------------------
export async function sendMail(
  mailTo: string,
  mailSubject: string,
  mailText: string,
) {
  try {
    const mailer = await getMailerConfig();
    const transporter = createTransport(mailer.transport); // NOSONAR — TLS controlled via MAILER_SECURE env var
    const mailOptions = {
      from: mailer.from,
      to: mailTo,
      subject: mailSubject,
      text: mailText,
    };

    await transporter.sendMail(mailOptions);

    return true;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
export async function mailMeetingSession(
  meetingSession: MeetingSessionForReminder,
) {
  try {
    const mailTo = meetingSession.email;
    if (!mailTo) throw new Error("email not found");

    let meetingName = meetingSession.meeting_name;
    if (meetingSession.meeting_schedule_name) {
      meetingName = `${meetingName} (${meetingSession.meeting_schedule_name})`;
    }

    const baseLinkForRole = `https://${APP_FQDN}/pri/${meetingSession.role}`;
    const meetingLink = `${baseLinkForRole}/wait/${meetingSession.id}`;

    const mailSubject = `You have a meeting in 30 minutes, ${meetingName}`;
    const mailText = `
      You have a meeting in 30 minutes:
      ${meetingName}

      ${meetingLink}
    `.replace(/^ +/gm, "");

    const res = await sendMail(mailTo, mailSubject, mailText);
    if (!res) throw new Error("sendMail failed");

    return true;
  } catch {
    return false;
  }
}
