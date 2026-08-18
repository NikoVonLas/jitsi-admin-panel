export class SlidingWindowRateLimiter {
  readonly #attempts = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  take(key: string, now = Date.now()): boolean {
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

export function loginRateLimitKey(req: Request, email: string): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0].trim();
  const address = forwarded || req.headers.get("x-real-ip") || "unknown";
  return `${address}\0${email}`;
}
