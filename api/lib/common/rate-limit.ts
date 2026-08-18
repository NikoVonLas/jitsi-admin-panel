export class SlidingWindowRateLimiter {
  readonly #attempts = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 10_000,
  ) {}

  take(key: string, now = Date.now()): boolean {
    if (!this.#attempts.has(key) && this.#attempts.size >= this.maxKeys) {
      const cutoff = now - this.windowMs;
      for (const [candidate, timestamps] of this.#attempts) {
        if (timestamps.every((timestamp) => timestamp <= cutoff)) {
          this.#attempts.delete(candidate);
        }
      }
      if (this.#attempts.size >= this.maxKeys) {
        const oldest = this.#attempts.keys().next().value;
        if (oldest !== undefined) this.#attempts.delete(oldest);
      }
    }

    const cutoff = now - this.windowMs;
    const attempts = (this.#attempts.get(key) ?? []).filter(
      (timestamp) => timestamp > cutoff,
    );
    if (attempts.length >= this.limit) {
      this.#attempts.set(key, attempts);
      return false;
    }
    attempts.push(now);
    this.#attempts.set(key, attempts);
    return true;
  }

  reset(key: string): void {
    this.#attempts.delete(key);
  }
}

export function clientAddress(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  const forwarded = req.headers.get("x-forwarded-for")?.split(",").at(-1)
    ?.trim();
  return realIp || forwarded || "unknown";
}

export function loginRateLimitKey(req: Request, email: string): string {
  return `${clientAddress(req)}\0${email}`;
}
