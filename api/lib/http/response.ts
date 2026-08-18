export function internalServerError(): Response {
  const body = {
    error: {
      message: "Internal Server Error",
    },
  };

  return new Response(JSON.stringify(body), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

// -----------------------------------------------------------------------------
export function methodNotAllowed(): Response {
  const body = {
    error: {
      message: "Method Not Allowed",
    },
  };

  return new Response(JSON.stringify(body), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

// -----------------------------------------------------------------------------
export function notFound(): Response {
  const body = {
    error: {
      message: "Not Found",
    },
  };

  return new Response(JSON.stringify(body), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

// -----------------------------------------------------------------------------
export function ok(body: string, headers?: Headers): Response {
  const responseHeaders = new Headers(headers);
  if (!responseHeaders.has("Content-Type")) {
    responseHeaders.set("Content-Type", "application/json");
  }

  return new Response(body, {
    status: 200,
    headers: responseHeaders,
  });
}

// -----------------------------------------------------------------------------
export function forbidden(): Response {
  const body = {
    error: {
      message: "Forbidden",
    },
  };

  return new Response(JSON.stringify(body), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

// -----------------------------------------------------------------------------
export function conflict(): Response {
  const body = {
    error: {
      message: "Conflict",
    },
  };

  return new Response(JSON.stringify(body), {
    status: 409,
    headers: { "Content-Type": "application/json" },
  });
}

// -----------------------------------------------------------------------------
export function badRequest(message = "Bad Request"): Response {
  return new Response(JSON.stringify({ error: { message } }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

// -----------------------------------------------------------------------------
export function unauthorized(): Response {
  const body = {
    error: {
      message: "Unauthorized",
    },
  };

  return new Response(JSON.stringify(body), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
