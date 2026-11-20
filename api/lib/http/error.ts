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
  if (error instanceof SyntaxError) {
    error = new HttpError(400, "Invalid JSON body");
  }
  if (!(error instanceof HttpError)) return undefined;

  return new Response(
    JSON.stringify({ error: { message: error.message } }),
    {
      status: error.status,
      headers: { "Content-Type": "application/json" },
    },
  );
}
