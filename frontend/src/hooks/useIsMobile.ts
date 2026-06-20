import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 992): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof globalThis !== 'undefined' && globalThis.innerWidth < breakpoint
  );
  useEffect(() => {
    const mq = globalThis.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}
