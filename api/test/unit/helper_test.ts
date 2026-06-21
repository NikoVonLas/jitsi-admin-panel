import { assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  dateAfterXDays,
  getFirstDayOfMonth,
  getFirstDayOfWeek,
} from "../../lib/common/helper.ts";

describe("getFirstDayOfMonth", () => {
  it("returns first day of same month", () => {
    assertEquals(getFirstDayOfMonth("2024-03-15"), "2024-03-01");
  });

  it("returns same day when already first", () => {
    assertEquals(getFirstDayOfMonth("2024-01-01"), "2024-01-01");
  });

  it("handles last day of month", () => {
    assertEquals(getFirstDayOfMonth("2024-02-29"), "2024-02-01");
  });

  it("handles December", () => {
    assertEquals(getFirstDayOfMonth("2024-12-31"), "2024-12-01");
  });

  it("throws on invalid date", () => {
    assertThrows(() => getFirstDayOfMonth("not-a-date"), Error, "invalid date");
  });

  it("throws on empty string", () => {
    assertThrows(() => getFirstDayOfMonth(""), Error, "invalid date");
  });
});

describe("getFirstDayOfWeek", () => {
  it("returns Sunday for a Wednesday", () => {
    // 2024-03-13 is Wednesday, Sunday is 2024-03-10
    assertEquals(getFirstDayOfWeek("2024-03-13"), "2024-03-10");
  });

  it("returns same day when already Sunday", () => {
    // 2024-03-10 is Sunday
    assertEquals(getFirstDayOfWeek("2024-03-10"), "2024-03-10");
  });

  it("returns correct Sunday for Saturday", () => {
    // 2024-03-16 is Saturday, Sunday is 2024-03-10
    assertEquals(getFirstDayOfWeek("2024-03-16"), "2024-03-10");
  });

  it("handles month boundary correctly", () => {
    // 2024-03-01 is Friday, Sunday is 2024-02-25
    assertEquals(getFirstDayOfWeek("2024-03-01"), "2024-02-25");
  });

  it("handles year boundary", () => {
    // 2024-01-01 is Monday, Sunday is 2023-12-31
    assertEquals(getFirstDayOfWeek("2024-01-01"), "2023-12-31");
  });

  it("throws on invalid date", () => {
    assertThrows(() => getFirstDayOfWeek("bad-date"), Error, "invalid date");
  });
});

describe("dateAfterXDays", () => {
  it("adds positive days", () => {
    assertEquals(dateAfterXDays("2024-03-01", 10), "2024-03-11");
  });

  it("subtracts negative days", () => {
    assertEquals(dateAfterXDays("2024-03-10", -3), "2024-03-07");
  });

  it("zero days returns same date", () => {
    assertEquals(dateAfterXDays("2024-06-15", 0), "2024-06-15");
  });

  it("crosses month boundary", () => {
    assertEquals(dateAfterXDays("2024-01-28", 5), "2024-02-02");
  });

  it("crosses year boundary", () => {
    assertEquals(dateAfterXDays("2024-12-30", 3), "2025-01-02");
  });

  it("handles leap year Feb", () => {
    assertEquals(dateAfterXDays("2024-02-28", 1), "2024-02-29");
  });

  it("throws on invalid date", () => {
    assertThrows(
      () => dateAfterXDays("not-a-date", 1),
      Error,
      "invalid date",
    );
  });
});
