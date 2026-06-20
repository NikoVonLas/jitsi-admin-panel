export function internalServerError(): Response {
  const body = {
    error: {
      message: "Internal Server Error",
    },
  };

  return new Response(JSON.stringify(body), {
    status: 500,
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
  });
}

// -----------------------------------------------------------------------------
export function ok(body: string, headers?: Headers): Response {
  if (headers) {
    return new Response(body, {
      status: 200,
      headers: headers,
    });
  }

  return new Response(body, {
    status: 200,
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
  });
}

// -----------------------------------------------------------------------------
export function badRequest(message = "Bad Request"): Response {
  return new Response(JSON.stringify({ error: { message } }), { status: 400 });
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
  });
}
