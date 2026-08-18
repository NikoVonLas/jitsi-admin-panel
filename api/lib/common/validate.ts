export function isValidUrl(url: string): boolean {
  const regex = /^https?:\/\/[a-zA-Z\d.-]+(?::\d+)?(?:\/[\da-zA-Z./-]*)?$/;

  if (regex.exec(url)) return true;

  return false;
}

export function isValidOidcIssuerUrl(
  value: string,
  allowHttp = false,
): boolean {
  try {
    const url = new URL(value);
    const validProtocol = url.protocol === "https:" ||
      (allowHttp && url.protocol === "http:");

    return validProtocol && Boolean(url.hostname) && !url.username &&
      !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}
