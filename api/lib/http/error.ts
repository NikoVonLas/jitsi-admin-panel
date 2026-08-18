export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function asHttpErrorResponse(error: unknown): Response | undefined {
  const httpError = error instanceof HttpError
    ? error
    : error instanceof SyntaxError
    ? new HttpError(400, "Invalid JSON body")
    : undefined;
  if (!httpError) return undefined;

  return new Response(
    JSON.stringify({ error: { message: httpError.message } }),
    {
      status: httpError.status,
      headers: { "Content-Type": "application/json" },
    },
  );
}
