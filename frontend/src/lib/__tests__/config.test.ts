import { describe, it, expect } from 'vitest';
import { FORM_WIDTH, AUTH_TYPE_OPTIONS, TOKEN_ALGO, SCHEDULE_ATTR_TYPE_OPTIONS } from '../config';

describe('config constants', () => {
  it('FORM_WIDTH is a non-empty string', () => {
    expect(typeof FORM_WIDTH).toBe('string');
    expect(FORM_WIDTH.length).toBeGreaterThan(0);
  });

  it('AUTH_TYPE_OPTIONS is a non-empty array', () => {
    expect(Array.isArray(AUTH_TYPE_OPTIONS)).toBe(true);
    expect(AUTH_TYPE_OPTIONS.length).toBeGreaterThan(0);
  });

  it('AUTH_TYPE_OPTIONS entries have value and label', () => {
    for (const opt of AUTH_TYPE_OPTIONS) {
      expect(Array.isArray(opt)).toBe(true);
      expect(opt.length).toBe(2);
      expect(typeof opt[0]).toBe('string');
      expect(typeof opt[1]).toBe('string');
    }
  });

  it('AUTH_TYPE_OPTIONS includes none and token', () => {
    const values = AUTH_TYPE_OPTIONS.map((o) => o[0]);
    expect(values).toContain('none');
    expect(values).toContain('token');
  });

  it('TOKEN_ALGO is HS256', () => {
    expect(TOKEN_ALGO).toBe('HS256');
  });

  it('SCHEDULE_ATTR_TYPE_OPTIONS has once/daily/weekly', () => {
    const values = SCHEDULE_ATTR_TYPE_OPTIONS.map((o) => o[0]);
    expect(values).toContain('o');
    expect(values).toContain('d');
    expect(values).toContain('w');
  });
});
