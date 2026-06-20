// -----------------------------------------------------------------------------
export function parseEnabledFilter(val: unknown): boolean | null {
  if (val === true) return true;
  if (val === false) return false;
  return null;
}
