import { get } from './api';

export function navigate(url: string, navigateFn?: (path: string) => void): void {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    globalThis.location.href = url;
  } else if (navigateFn) {
    navigateFn(url);
  } else {
    globalThis.location.href = url;
  }
}

export async function ping(): Promise<void> {
  try {
    const now = Date.now();
    const pingedAt = localStorage.getItem('pinged_at') || '0';
    if (Number.isNaN(Number(pingedAt))) {
      localStorage.setItem('pinged_at', String(now));
    }
    if (now - Number(pingedAt) >= 60000) {
      localStorage.setItem('pinged_at', String(now));
      await get('/api/pri/identity/ping');
    }
  } catch {
    // The next heartbeat retries after a network or storage failure.
  } finally {
    setTimeout(ping, 60000);
  }
}
