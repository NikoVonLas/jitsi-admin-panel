import { v5 as uuid } from "@std/uuid";

const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

export async function createOidcIdentityId(
  issuer: string,
  subject: string,
): Promise<string> {
  const scopedSubject = new TextEncoder().encode(`${issuer}\0${subject}`);
  return await uuid.generate(UUID_NAMESPACE, scopedSubject);
}
