export interface Timers {
  housekeeping: ReturnType<typeof setTimeout>;
  cronjobRemindMeetingSession: ReturnType<typeof setTimeout>;
}
