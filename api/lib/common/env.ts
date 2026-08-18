export function parseBoolean(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (value === undefined || value.trim() === "") return fallback;

  switch (value.trim().toLowerCase()) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return fallback;
  }
}

export function getBooleanEnv(name: string, fallback: boolean): boolean {
  return parseBoolean(Deno.env.get(name), fallback);
}
