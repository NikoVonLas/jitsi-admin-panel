import { assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  dateAfterXDays,
  getFirstDayOfMonth,
  getFirstDayOfWeek,
} from "../../../lib/common/helper.ts";

describe("getFirstDayOfMonth", () => {
  it("returns the 1st of the month for mid-month date", () => {
    assertEquals(getFirstDayOfMonth("2024-03-15"), "2024-03-01");
  });

  it("returns the same day when already the 1st", () => {
    assertEquals(getFirstDayOfMonth("2024-03-01"), "2024-03-01");
  });

  it("handles last day of month", () => {
    assertEquals(getFirstDayOfMonth("2024-03-31"), "2024-03-01");
  });

  it("handles January correctly", () => {
    assertEquals(getFirstDayOfMonth("2024-01-20"), "2024-01-01");
  });

  it("handles December correctly", () => {
    assertEquals(getFirstDayOfMonth("2024-12-25"), "2024-12-01");
  });

  it("throws for invalid date", () => {
    assertThrows(() => getFirstDayOfMonth("not-a-date"), Error, "invalid date");
  });

  it("handles leap year February", () => {
    assertEquals(getFirstDayOfMonth("2024-02-29"), "2024-02-01");
  });
});

describe("getFirstDayOfWeek", () => {
  // The API version uses Sunday=0 as first day of week (hardcoded)
  it("returns Sunday for a Wednesday", () => {
    // 2024-03-13 is a Wednesday, Sunday is 2024-03-10
    assertEquals(getFirstDayOfWeek("2024-03-13"), "2024-03-10");
  });

  it("returns same day when already Sunday", () => {
    // 2024-03-10 is a Sunday
    assertEquals(getFirstDayOfWeek("2024-03-10"), "2024-03-10");
  });

  it("returns Sunday for a Saturday", () => {
    // 2024-03-16 is a Saturday
    assertEquals(getFirstDayOfWeek("2024-03-16"), "2024-03-10");
  });

  it("returns Sunday for a Monday", () => {
    // 2024-03-11 is a Monday
    assertEquals(getFirstDayOfWeek("2024-03-11"), "2024-03-10");
  });

  it("handles cross-month boundary", () => {
    // 2024-04-01 is a Monday, Sunday was 2024-03-31
    assertEquals(getFirstDayOfWeek("2024-04-01"), "2024-03-31");
  });

  it("throws for invalid date", () => {
    assertThrows(() => getFirstDayOfWeek("invalid"), Error, "invalid date");
  });
});

describe("dateAfterXDays", () => {
  it("adds positive days", () => {
    assertEquals(dateAfterXDays("2024-03-01", 5), "2024-03-06");
  });

  it("adds zero days returns same date", () => {
    assertEquals(dateAfterXDays("2024-03-01", 0), "2024-03-01");
  });

  it("subtracts days with negative value", () => {
    assertEquals(dateAfterXDays("2024-03-06", -5), "2024-03-01");
  });

  it("handles month boundary", () => {
    assertEquals(dateAfterXDays("2024-01-30", 5), "2024-02-04");
  });

  it("handles year boundary", () => {
    assertEquals(dateAfterXDays("2024-12-30", 5), "2025-01-04");
  });

  it("handles leap year day", () => {
    assertEquals(dateAfterXDays("2024-02-28", 1), "2024-02-29");
  });

  it("handles 30 days", () => {
    assertEquals(dateAfterXDays("2024-01-01", 30), "2024-01-31");
  });

  it("throws for invalid date", () => {
    assertThrows(
      () => dateAfterXDays("not-a-date", 5),
      Error,
      "invalid date",
    );
  });
});
