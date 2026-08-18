import { AUTH_LOCAL } from "../../config.ts";
import {
  getOidcProvider,
  hasOtherEnabledOidcProvider,
} from "../database/oidc-provider.ts";
import { HttpError } from "../http/error.ts";

export async function ensureOidcProviderRemovalDoesNotLockOut(
  providerId: string,
  localAuth = AUTH_LOCAL,
): Promise<void> {
  if (localAuth) return;
  const provider = await getOidcProvider(providerId);
  if (
    provider?.enabled && !await hasOtherEnabledOidcProvider(providerId)
  ) {
    throw new HttpError(
      409,
      "Cannot disable or delete the last enabled OIDC provider",
    );
  }
}
