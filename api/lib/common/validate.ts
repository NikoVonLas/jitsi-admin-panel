export function isValidUrl(url: string): boolean {
  const regex = /^https?:\/\/[a-zA-Z\d.-]+(?::\d+)?(?:\/[\da-zA-Z./-]*)?$/;

  if (regex.exec(url)) return true;

  return false;
}
