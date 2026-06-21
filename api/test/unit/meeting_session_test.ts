import { assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { checkScheduleAttr } from "../../lib/database/meeting-session.ts";

// Helpers
function futureIso(minutes = 60): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function futureEndIso(days = 7): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
describe("checkScheduleAttr — type: once (o)", () => {
  it("accepts valid once schedule", () => {
    checkScheduleAttr({
      type: "o",
      duration: "60",
      started_at: futureIso(60),
    });
  });

  it("throws when duration < 1", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "o",
          duration: "0",
          started_at: futureIso(60),
        }),
      Error,
      "duration is out of range",
    );
  });

  it("throws when duration > 1440", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "o",
          duration: "1441",
          started_at: futureIso(60),
        }),
      Error,
      "duration is out of range",
    );
  });

  it("throws when session is already over", () => {
    const pastStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "o",
          duration: "60",
          started_at: pastStart,
        }),
      Error,
      "it is already over",
    );
  });
});

// ---------------------------------------------------------------------------
describe("checkScheduleAttr — type: daily (d)", () => {
  it("accepts valid daily schedule with rep_end_type x", () => {
    checkScheduleAttr({
      type: "d",
      duration: "60",
      started_at: futureIso(60),
      rep_end_type: "x",
      rep_end_x: "5",
      rep_every: "1",
    });
  });

  it("accepts valid daily schedule with rep_end_type forever", () => {
    checkScheduleAttr({
      type: "d",
      duration: "30",
      started_at: futureIso(30),
      rep_end_type: "forever",
      rep_every: "2",
    });
  });

  it("throws when duration < 1", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "d",
          duration: "0",
          started_at: futureIso(60),
          rep_end_type: "forever",
          rep_every: "1",
        }),
      Error,
      "duration is out of range",
    );
  });

  it("throws when duration > 1440", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "d",
          duration: "9999",
          started_at: futureIso(60),
          rep_end_type: "forever",
          rep_every: "1",
        }),
      Error,
      "duration is out of range",
    );
  });

  it("throws on unknown rep_end_type", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "d",
          duration: "60",
          started_at: futureIso(60),
          rep_end_type: "at",
          rep_every: "1",
        }),
      Error,
      "wrong rep_end_type",
    );
  });

  it("throws when rep_end_x < 1", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "d",
          duration: "60",
          started_at: futureIso(60),
          rep_end_type: "x",
          rep_end_x: "0",
          rep_every: "1",
        }),
      Error,
      "times is out of range",
    );
  });

  it("throws when rep_every < 1", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "d",
          duration: "60",
          started_at: futureIso(60),
          rep_end_type: "forever",
          rep_every: "0",
        }),
      Error,
      "rep_every is out of range",
    );
  });

  it("throws when all x repetitions are already over", () => {
    const pastStart = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      .toISOString();
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "d",
          duration: "60",
          started_at: pastStart,
          rep_end_type: "x",
          rep_end_x: "2",
          rep_every: "1",
        }),
      Error,
      "it is already over",
    );
  });
});

// ---------------------------------------------------------------------------
describe("checkScheduleAttr — type: weekly (w)", () => {
  it("accepts valid weekly schedule", () => {
    checkScheduleAttr({
      type: "w",
      duration: "60",
      started_at: futureIso(60),
      rep_end_type: "at",
      rep_end_at: futureEndIso(14),
      rep_every: "1",
      rep_days: "0010100",
      timezone_offset: "0",
    });
  });

  it("throws when duration < 1", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "w",
          duration: "0",
          started_at: futureIso(60),
          rep_end_type: "at",
          rep_end_at: futureEndIso(7),
          rep_every: "1",
          rep_days: "1000000",
          timezone_offset: "0",
        }),
      Error,
      "duration is out of range",
    );
  });

  it("throws when rep_end_type is not 'at'", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "w",
          duration: "60",
          started_at: futureIso(60),
          rep_end_type: "x",
          rep_end_at: futureEndIso(7),
          rep_every: "1",
          rep_days: "1000000",
          timezone_offset: "0",
        }),
      Error,
      "wrong rep_end_type",
    );
  });

  it("throws on invalid rep_days pattern", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "w",
          duration: "60",
          started_at: futureIso(60),
          rep_end_type: "at",
          rep_end_at: futureEndIso(7),
          rep_every: "1",
          rep_days: "10001",
          timezone_offset: "0",
        }),
      Error,
      "wrong rep_days",
    );
  });

  it("throws when rep_every < 1", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "w",
          duration: "60",
          started_at: futureIso(60),
          rep_end_type: "at",
          rep_end_at: futureEndIso(7),
          rep_every: "0",
          rep_days: "1000000",
          timezone_offset: "0",
        }),
      Error,
      "rep_every is out of range",
    );
  });

  it("throws when started_at > rep_end_at", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "w",
          duration: "60",
          started_at: futureEndIso(14),
          rep_end_type: "at",
          rep_end_at: futureIso(60),
          rep_every: "1",
          rep_days: "1000000",
          timezone_offset: "0",
        }),
      Error,
      "invalid period",
    );
  });

  it("throws when rep_end_at is in the past", () => {
    const pastEnd = new Date(Date.now() - 60 * 1000).toISOString();
    const evenMorePast = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      .toISOString();
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "w",
          duration: "60",
          started_at: evenMorePast,
          rep_end_type: "at",
          rep_end_at: pastEnd,
          rep_every: "1",
          rep_days: "1000000",
          timezone_offset: "0",
        }),
      Error,
      "it is already over",
    );
  });
});

// ---------------------------------------------------------------------------
describe("checkScheduleAttr — type: monthly (m)", () => {
  it("accepts valid monthly schedule (day mode)", () => {
    checkScheduleAttr({
      type: "m",
      duration: "60",
      started_at: futureIso(60),
      rep_end_type: "at",
      rep_end_at: futureEndIso(90),
      rep_every: "1",
      timezone_offset: "0",
      rep_month_mode: "d",
      rep_month_day: "15",
    });
  });

  it("accepts valid monthly schedule (weekday mode)", () => {
    checkScheduleAttr({
      type: "m",
      duration: "60",
      started_at: futureIso(60),
      rep_end_type: "at",
      rep_end_at: futureEndIso(90),
      rep_every: "1",
      timezone_offset: "0",
      rep_month_mode: "w",
      rep_month_pos: "1",
      rep_month_dow: "2",
    });
  });

  it("throws when duration out of range", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "m",
          duration: "0",
          started_at: futureIso(60),
          rep_end_type: "at",
          rep_end_at: futureEndIso(90),
          rep_every: "1",
          timezone_offset: "0",
          rep_month_mode: "d",
          rep_month_day: "1",
        }),
      Error,
      "duration is out of range",
    );
  });

  it("throws on wrong rep_end_type", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "m",
          duration: "60",
          started_at: futureIso(60),
          rep_end_type: "forever",
          rep_end_at: futureEndIso(90),
          rep_every: "1",
          timezone_offset: "0",
          rep_month_mode: "d",
          rep_month_day: "1",
        }),
      Error,
      "wrong rep_end_type",
    );
  });

  it("throws when rep_every < 1", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "m",
          duration: "60",
          started_at: futureIso(60),
          rep_end_type: "at",
          rep_end_at: futureEndIso(90),
          rep_every: "0",
          timezone_offset: "0",
          rep_month_mode: "d",
          rep_month_day: "1",
        }),
      Error,
      "rep_every is out of range",
    );
  });

  it("throws when rep_month_day out of range", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "m",
          duration: "60",
          started_at: futureIso(60),
          rep_end_type: "at",
          rep_end_at: futureEndIso(90),
          rep_every: "1",
          timezone_offset: "0",
          rep_month_mode: "d",
          rep_month_day: "32",
        }),
      Error,
      "rep_month_day is out of range",
    );
  });

  it("throws on invalid rep_month_pos", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "m",
          duration: "60",
          started_at: futureIso(60),
          rep_end_type: "at",
          rep_end_at: futureEndIso(90),
          rep_every: "1",
          timezone_offset: "0",
          rep_month_mode: "w",
          rep_month_pos: "0",
          rep_month_dow: "1",
        }),
      Error,
      "rep_month_pos is invalid",
    );
  });

  it("throws on invalid rep_month_dow", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "m",
          duration: "60",
          started_at: futureIso(60),
          rep_end_type: "at",
          rep_end_at: futureEndIso(90),
          rep_every: "1",
          timezone_offset: "0",
          rep_month_mode: "w",
          rep_month_pos: "1",
          rep_month_dow: "7",
        }),
      Error,
      "rep_month_dow is out of range",
    );
  });

  it("throws on unknown rep_month_mode", () => {
    assertThrows(
      () =>
        checkScheduleAttr({
          type: "m",
          duration: "60",
          started_at: futureIso(60),
          rep_end_type: "at",
          rep_end_at: futureEndIso(90),
          rep_every: "1",
          timezone_offset: "0",
          rep_month_mode: "x",
        }),
      Error,
      "unknown rep_month_mode",
    );
  });
});

// ---------------------------------------------------------------------------
describe("checkScheduleAttr — unknown type", () => {
  it("throws on unknown schedule type", () => {
    assertThrows(
      () => checkScheduleAttr({ type: "z" }),
      Error,
      "Unknow schedule type",
    );
  });
});
