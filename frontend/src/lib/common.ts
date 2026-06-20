export function epochToIntervalString(time: number): string {
  try {
    let sign = '';
    if (time < 0) { sign = '-'; time = -1 * time; }
    const day = Math.trunc(time / 86400);
    let remainder = time % 86400;
    const hour = Math.trunc(remainder / 3600);
    remainder = remainder % 3600;
    const min = Math.trunc(remainder / 60);
    const sec = Math.trunc(remainder % 60);
    let interval = sign;
    if (day > 1) interval = `${day} days`;
    else if (day === 1) interval = `${day} day`;
    interval = `${interval} ${String(hour).padStart(2, '0')}`;
    interval = `${interval}:${String(min).padStart(2, '0')}`;
    interval = `${interval}:${String(sec).padStart(2, '0')}`;
    return interval;
  } catch { return ''; }
}

export function getToday(): string {
  const now = new Date();
  return now.getFullYear() + '-' +
    ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
    ('0' + now.getDate()).slice(-2);
}

export function dateAfterXDays(days: number): string {
  const now = new Date();
  const date = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  if (Number.isNaN(date.getTime())) throw new Error('invalid date');
  return date.getFullYear() + '-' +
    ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
    ('0' + date.getDate()).slice(-2);
}

export function getFirstDayOfMonth(date: string): string {
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) throw new Error('invalid date');
  const diff = _date.getDate() - 1;
  const first = new Date(_date.getTime() - diff * 24 * 60 * 60 * 1000);
  return first.getFullYear() + '-' +
    ('0' + (first.getMonth() + 1)).slice(-2) + '-' +
    ('0' + first.getDate()).slice(-2);
}

export function getDayOfPreviousMonth(date: string): string {
  const date0 = new Date(date);
  if (Number.isNaN(date0.getTime())) throw new Error('invalid date');
  let day = date0.getDate();
  const date1 = new Date(date0.getTime() - day * 24 * 60 * 60 * 1000);
  if (day < 29) { /* intentional no-op */ }
  else if (day < 32 && date0.getMonth() === 2) { day = 28; }
  else if (day < 31) { /* intentional no-op */ }
  else { day = 30; }
  return date1.getFullYear() + '-' +
    ('0' + (date1.getMonth() + 1)).slice(-2) + '-' +
    ('0' + String(day)).slice(-2);
}

export function getDayOfNextMonth(date: string): string {
  const date0 = new Date(date);
  if (Number.isNaN(date0.getTime())) throw new Error('invalid date');
  let day = date0.getDate();
  let diffAsDays = 12;
  if (day < 20) diffAsDays = 32;
  const date1 = new Date(date0.getTime() + diffAsDays * 24 * 60 * 60 * 1000);
  if (day < 29) { /* intentional no-op */ }
  else if (day < 32 && date0.getMonth() === 0) { day = 28; }
  else if (day < 31) { /* intentional no-op */ }
  else { day = 30; }
  return date1.getFullYear() + '-' +
    ('0' + (date1.getMonth() + 1)).slice(-2) + '-' +
    ('0' + String(day)).slice(-2);
}

export function getFirstDayOfWeek(date: string): string {
  const weekStart = Number(globalThis.localStorage?.getItem('week_start') ?? 1);
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) throw new Error('invalid date');
  const dow = _date.getDay();
  let diff = dow - weekStart;
  if (diff < 0) diff += 7;
  const first = new Date(_date.getTime() - diff * 24 * 60 * 60 * 1000);
  return first.getFullYear() + '-' +
    ('0' + (first.getMonth() + 1)).slice(-2) + '-' +
    ('0' + first.getDate()).slice(-2);
}

export function getLastDayOfWeek(date: string): string {
  const first = getFirstDayOfWeek(date);
  const _first = new Date(first);
  const last = new Date(_first.getTime() + 6 * 24 * 60 * 60 * 1000);
  return last.getFullYear() + '-' +
    ('0' + (last.getMonth() + 1)).slice(-2) + '-' +
    ('0' + last.getDate()).slice(-2);
}

export function getCalendarDay(firstDay: string, week: number, day: number): string {
  const _firstDay = new Date(firstDay);
  if (Number.isNaN(_firstDay.getTime())) throw new Error('invalid date');
  const target = new Date(_firstDay.getTime() + (week * 7 + day) * 24 * 60 * 60 * 1000);
  return target.getFullYear() + '-' +
    ('0' + (target.getMonth() + 1)).slice(-2) + '-' +
    ('0' + target.getDate()).slice(-2);
}

export function toLocaleDate(date: string): string {
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) throw new Error('invalid date');
  return _date.getFullYear() + '-' +
    ('0' + (_date.getMonth() + 1)).slice(-2) + '-' +
    ('0' + _date.getDate()).slice(-2);
}

export function toLocaleTime(date: string): string {
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) throw new Error('invalid date');
  return ('0' + _date.getHours()).slice(-2) + ':' + ('0' + _date.getMinutes()).slice(-2);
}

export function toCalendarDayLabel(date: string, locale = 'en'): string {
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) throw new Error('invalid date');
  return _date.toLocaleString(locale, { day: 'numeric', month: 'long' });
}

export function toLocaleMonthName(date: string, locale = 'en'): string {
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) throw new Error('invalid date');
  return _date.toLocaleString(locale, { month: 'short' });
}

export function toLocaleMonthNameLong(date: string, locale = 'en'): string {
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) throw new Error('invalid date');
  const name = _date.toLocaleString(locale, { month: 'long' });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function showLocaleDate(date: string, locale = 'en'): string {
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) throw new Error('invalid date');
  return _date.toLocaleString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function showLocaleDatetime(date: string, locale = 'en'): string {
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) throw new Error('invalid date');
  return _date.toLocaleString(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function toLocaleInterval(date: string, minutes: number, locale = 'en'): string {
  const date0 = new Date(date);
  if (Number.isNaN(date0.getTime())) throw new Error('invalid date');
  const date1 = new Date(date0.getTime() + minutes * 60 * 1000);
  const time0 = date0.toLocaleString(locale, { hour: '2-digit', minute: '2-digit' });
  const time1 = date1.toLocaleString(locale, { hour: '2-digit', minute: '2-digit' });
  return `${time0} - ${time1}`;
}

export function getEndTime(time: string, minutes: number): string {
  const today = getToday();
  const date0 = new Date(`${today}T${time}`);
  if (Number.isNaN(date0.getTime())) throw new Error('invalid date');
  const date1 = new Date(date0.getTime() + minutes * 60 * 1000);
  return ('0' + date1.getHours()).slice(-2) + ':' + ('0' + date1.getMinutes()).slice(-2);
}

export function getDuration(time0: string, time1: string): number {
  const today = getToday();
  const date0 = new Date(`${today}T${time0}`);
  const date1 = new Date(`${today}T${time1}`);
  if (Number.isNaN(date0.getTime()) || Number.isNaN(date1.getTime())) throw new Error('invalid date');
  const millis = date1.getTime() - date0.getTime();
  const minutes = Math.round(millis / (1000 * 60));
  return minutes > 0 ? minutes : 1440 + minutes;
}

export function isOnline(date: string): boolean {
  const now = new Date();
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) return false;
  return _date.getTime() - now.getTime() < 15 * 60 * 1000;
}

export function isToday(date: string): boolean {
  const now = new Date();
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) return false;
  return _date.getFullYear() === now.getFullYear() &&
    _date.getMonth() === now.getMonth() &&
    _date.getDate() === now.getDate();
}

export function isAllDay(date: string, minutes: string): boolean {
  const _date = new Date(date);
  if (Number.isNaN(_date.getTime())) throw new Error('invalid date');
  return _date.getHours() === 0 && _date.getMinutes() === 0 && minutes === '1440';
}

export function isOver(date: Date, minutes = 0): boolean {
  if (Number.isNaN(date.getTime())) throw new Error('invalid date');
  const now = new Date();
  return now.getTime() > date.getTime() + minutes * 60 * 1000;
}


export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy'); // NOSONAR - legacy fallback for browsers without Clipboard API
  el.remove();
}
