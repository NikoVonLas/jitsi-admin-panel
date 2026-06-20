import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  epochToIntervalString,
  getToday,
  dateAfterXDays,
  getFirstDayOfMonth,
  getDayOfPreviousMonth,
  getDayOfNextMonth,
  getFirstDayOfWeek,
  getLastDayOfWeek,
  getCalendarDay,
  toLocaleDate,
  toLocaleTime,
  toCalendarDayLabel,
  toLocaleMonthName,
  toLocaleMonthNameLong,
  showLocaleDate,
  showLocaleDatetime,
  toLocaleInterval,
  getEndTime,
  getDuration,
  isOnline,
  isToday,
  isAllDay,
  isOver,
} from '../common';

// --------------------------------------------------------------------------
describe('epochToIntervalString', () => {
  it('formats zero', () => {
    expect(epochToIntervalString(0)).toBe(' 00:00:00');
  });

  it('formats 1 day', () => {
    expect(epochToIntervalString(86400)).toBe('1 day 00:00:00');
  });

  it('formats 2 days', () => {
    expect(epochToIntervalString(2 * 86400)).toBe('2 days 00:00:00');
  });

  it('formats hours and minutes', () => {
    expect(epochToIntervalString(3661)).toBe(' 01:01:01');
  });

  it('handles negative values', () => {
    const result = epochToIntervalString(-3600);
    expect(result).toContain('-');
    expect(result).toContain('01:00:00');
  });
});

// --------------------------------------------------------------------------
describe('getToday', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns current date', () => {
    const now = new Date();
    const expected = now.getFullYear() + '-' +
      ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
      ('0' + now.getDate()).slice(-2);
    expect(getToday()).toBe(expected);
  });
});

// --------------------------------------------------------------------------
describe('dateAfterXDays', () => {
  it('adds positive days', () => {
    const result = dateAfterXDays(5);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('adds zero days returns today', () => {
    expect(dateAfterXDays(0)).toBe(getToday());
  });

  it('subtracts days for negative value', () => {
    const minusFive = dateAfterXDays(-5);
    const today = getToday();
    expect(new Date(minusFive) < new Date(today)).toBe(true);
  });
});

// --------------------------------------------------------------------------
describe('getFirstDayOfMonth', () => {
  it('returns the 1st of the month', () => {
    expect(getFirstDayOfMonth('2024-03-15')).toBe('2024-03-01');
  });

  it('is idempotent on the 1st', () => {
    expect(getFirstDayOfMonth('2024-01-01')).toBe('2024-01-01');
  });

  it('throws for invalid date', () => {
    expect(() => getFirstDayOfMonth('not-a-date')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('getDayOfPreviousMonth', () => {
  it('returns a date in the previous month', () => {
    const result = getDayOfPreviousMonth('2024-03-15');
    expect(result.startsWith('2024-02')).toBe(true);
  });

  it('handles January → December', () => {
    const result = getDayOfPreviousMonth('2024-01-15');
    expect(result.startsWith('2023-12')).toBe(true);
  });

  it('throws for invalid date', () => {
    expect(() => getDayOfPreviousMonth('bad')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('getDayOfNextMonth', () => {
  it('returns a date in the next month', () => {
    const result = getDayOfNextMonth('2024-01-15');
    expect(result.startsWith('2024-02')).toBe(true);
  });

  it('handles December → January', () => {
    const result = getDayOfNextMonth('2024-12-15');
    expect(result.startsWith('2025-01')).toBe(true);
  });

  it('throws for invalid date', () => {
    expect(() => getDayOfNextMonth('bad')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('getFirstDayOfWeek', () => {
  beforeEach(() => {
    // Default week_start = 1 (Monday)
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: () => '1' },
      writable: true,
    });
  });

  it('returns Monday for a Wednesday', () => {
    // 2024-03-13 is a Wednesday, Monday is 2024-03-11
    expect(getFirstDayOfWeek('2024-03-13')).toBe('2024-03-11');
  });

  it('returns same day when already Monday', () => {
    expect(getFirstDayOfWeek('2024-03-11')).toBe('2024-03-11');
  });

  it('throws for invalid date', () => {
    expect(() => getFirstDayOfWeek('invalid')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('getLastDayOfWeek', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: () => '1' },
      writable: true,
    });
  });

  it('returns Sunday for a week starting Monday 2024-03-11', () => {
    expect(getLastDayOfWeek('2024-03-11')).toBe('2024-03-17');
  });
});

// --------------------------------------------------------------------------
describe('getCalendarDay', () => {
  it('returns the correct date for week 0 day 0 (same as firstDay)', () => {
    expect(getCalendarDay('2024-03-11', 0, 0)).toBe('2024-03-11');
  });

  it('returns correct date for week 1 day 3', () => {
    // 2024-03-11 + (1*7 + 3) = 2024-03-11 + 10 = 2024-03-21
    expect(getCalendarDay('2024-03-11', 1, 3)).toBe('2024-03-21');
  });

  it('throws for invalid firstDay', () => {
    expect(() => getCalendarDay('bad', 0, 0)).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('toLocaleDate', () => {
  it('returns YYYY-MM-DD', () => {
    expect(toLocaleDate('2024-03-15T12:00:00')).toBe('2024-03-15');
  });

  it('throws for invalid date', () => {
    expect(() => toLocaleDate('bad')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('toLocaleTime', () => {
  it('returns HH:MM format', () => {
    expect(toLocaleTime('2024-03-15T14:30:00')).toMatch(/^\d{2}:\d{2}$/);
  });

  it('throws for invalid date', () => {
    expect(() => toLocaleTime('bad')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('toCalendarDayLabel', () => {
  it('returns a non-empty string', () => {
    const label = toCalendarDayLabel('2024-03-15', 'en');
    expect(typeof label).toBe('string');
    expect(label.length).toBeGreaterThan(0);
  });

  it('throws for invalid date', () => {
    expect(() => toCalendarDayLabel('bad')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('toLocaleMonthName', () => {
  it('returns abbreviated month name in English', () => {
    const name = toLocaleMonthName('2024-03-15', 'en');
    expect(name.toLowerCase()).toContain('mar');
  });

  it('throws for invalid date', () => {
    expect(() => toLocaleMonthName('bad')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('toLocaleMonthNameLong', () => {
  it('returns capitalized full month name', () => {
    const name = toLocaleMonthNameLong('2024-03-15', 'en');
    expect(name[0]).toBe(name[0].toUpperCase());
    expect(name.toLowerCase()).toContain('march');
  });

  it('throws for invalid date', () => {
    expect(() => toLocaleMonthNameLong('bad')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('showLocaleDate', () => {
  it('returns formatted date string', () => {
    const result = showLocaleDate('2024-03-15', 'en');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('throws for invalid date', () => {
    expect(() => showLocaleDate('bad')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('showLocaleDatetime', () => {
  it('returns formatted datetime string', () => {
    const result = showLocaleDatetime('2024-03-15T14:30:00', 'en');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('throws for invalid date', () => {
    expect(() => showLocaleDatetime('bad')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('toLocaleInterval', () => {
  it('returns interval string', () => {
    const result = toLocaleInterval('2024-03-15T14:00:00', 60, 'en');
    expect(typeof result).toBe('string');
    expect(result).toContain('-');
  });

  it('throws for invalid date', () => {
    expect(() => toLocaleInterval('bad', 60)).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('getEndTime', () => {
  it('adds minutes to time', () => {
    const result = getEndTime('14:00', 60);
    expect(result).toBe('15:00');
  });

  it('handles minute overflow', () => {
    const result = getEndTime('14:45', 30);
    expect(result).toBe('15:15');
  });

  it('throws for invalid time', () => {
    expect(() => getEndTime('bad-time', 60)).toThrow();
  });
});

// --------------------------------------------------------------------------
describe('getDuration', () => {
  it('calculates duration in minutes', () => {
    expect(getDuration('14:00', '15:00')).toBe(60);
  });

  it('returns 1 for identical times (wraps to 1440 + 0)', () => {
    // Same start and end: millis = 0 → minutes = 0 → returns 1440 + 0 = 1440
    const result = getDuration('14:00', '14:00');
    expect(result).toBe(1440);
  });

  it('handles midnight wrap-around (23:00→01:00 = 2h = 120 min)', () => {
    // date1 (01:00) < date0 (23:00) in same day → negative millis → 1440+minutes
    // -22*60 = -1320 → 1440 + (-1320) = 120
    const result = getDuration('23:00', '01:00');
    expect(result).toBe(120);
  });

  it('throws for invalid times', () => {
    expect(() => getDuration('bad', '12:00')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('isOnline', () => {
  // isOnline returns true when date.getTime() - now < 15min
  // i.e. true for any past date AND for dates up to 15 min in the future
  it('returns true for a past date (meeting already started)', () => {
    const past = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(isOnline(past)).toBe(true);
  });

  it('returns true for a date within 15 minutes in the future', () => {
    const soon = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    expect(isOnline(soon)).toBe(true);
  });

  it('returns false for a date more than 15 minutes in the future', () => {
    const far = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    expect(isOnline(far)).toBe(false);
  });

  it('returns false for invalid date', () => {
    expect(isOnline('invalid')).toBe(false);
  });
});

// --------------------------------------------------------------------------
describe('isToday', () => {
  it('returns true for today', () => {
    expect(isToday(new Date().toISOString())).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(isToday(yesterday)).toBe(false);
  });

  it('returns false for invalid date', () => {
    expect(isToday('invalid')).toBe(false);
  });
});

// --------------------------------------------------------------------------
describe('isAllDay', () => {
  it('returns true for midnight start with 1440 min duration', () => {
    expect(isAllDay('2024-03-15T00:00:00', '1440')).toBe(true);
  });

  it('returns false for non-midnight start', () => {
    expect(isAllDay('2024-03-15T08:00:00', '1440')).toBe(false);
  });

  it('returns false for non-1440 duration', () => {
    expect(isAllDay('2024-03-15T00:00:00', '60')).toBe(false);
  });

  it('throws for invalid date', () => {
    expect(() => isAllDay('bad', '1440')).toThrow('invalid date');
  });
});

// --------------------------------------------------------------------------
describe('isOver', () => {
  it('returns true when date is in the past', () => {
    const past = new Date(Date.now() - 10000);
    expect(isOver(past)).toBe(true);
  });

  it('returns false when date is in the future', () => {
    const future = new Date(Date.now() + 60000);
    expect(isOver(future)).toBe(false);
  });

  it('returns true when date + minutes is in the past', () => {
    const now = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago
    expect(isOver(now, 3)).toBe(true);
  });

  it('returns false when date + minutes is in the future', () => {
    const now = new Date(Date.now() - 1 * 60 * 1000); // 1 min ago
    expect(isOver(now, 5)).toBe(false); // + 5 min = still in future
  });

  it('throws for invalid date', () => {
    expect(() => isOver(new Date('invalid'))).toThrow('invalid date');
  });
});
