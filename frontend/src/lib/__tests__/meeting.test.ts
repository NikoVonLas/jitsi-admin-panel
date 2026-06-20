import { describe, it, expect, vi } from 'vitest';

// Mock the i18n module before importing meeting.ts
vi.mock('../../i18n', () => ({
  t: (key: string) => key,
  useTr: () => (key: string) => key,
}));

import { SCHEDULE_TYPE_OPTIONS, getScheduleTypeOptions } from '../meeting';

describe('SCHEDULE_TYPE_OPTIONS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(SCHEDULE_TYPE_OPTIONS)).toBe(true);
    expect(SCHEDULE_TYPE_OPTIONS.length).toBeGreaterThan(0);
  });

  it('contains ephemeral, permanent, scheduled', () => {
    const values = SCHEDULE_TYPE_OPTIONS.map((o) => o[0]);
    expect(values).toContain('ephemeral');
    expect(values).toContain('permanent');
    expect(values).toContain('scheduled');
  });
});

describe('getScheduleTypeOptions', () => {
  it('returns an array with 3 options', () => {
    const opts = getScheduleTypeOptions();
    expect(opts.length).toBe(3);
  });

  it('first value is the type key', () => {
    const opts = getScheduleTypeOptions();
    expect(opts[0][0]).toBe('ephemeral');
    expect(opts[1][0]).toBe('permanent');
    expect(opts[2][0]).toBe('scheduled');
  });

  it('second value is the translation key (mocked as key itself)', () => {
    const opts = getScheduleTypeOptions();
    expect(typeof opts[0][1]).toBe('string');
    expect(opts[0][1]).toBe('meeting.type.ephemeral');
  });
});
