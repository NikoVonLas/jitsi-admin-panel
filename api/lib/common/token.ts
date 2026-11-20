import { create, getNumericDate } from "@emrahcom/jwt";
import type { Payload } from "@emrahcom/jwt";
import type { Algorithm } from "@emrahcom/jwt/algorithm";

// -----------------------------------------------------------------------------
export interface HsTokenOptions {
  appId: string;
  appSecret: string;
  appAlg: string;
  roomName: string;
  username: string;
  email: string;
  exp: number;
  expiresAt?: number;
  avatar?: string;
}

// -----------------------------------------------------------------------------
function resolveHsAlg(alg: string): { alg: Algorithm; hash: string } {
  if (alg === "HS512") return { alg: "HS512", hash: "SHA-512" };
  return { alg: "HS256", hash: "SHA-256" };
}

// -----------------------------------------------------------------------------
export async function generateCryptoKeyHS(
  secret: string,
  hash: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: hash },
    true,
    ["sign", "verify"],
  );

  return cryptoKey;
}

// -----------------------------------------------------------------------------
async function buildTokenHS(
  opts: HsTokenOptions,
  userContext: Record<string, unknown>,
  featuresContext: Record<string, unknown>,
): Promise<string> {
  const { appId, appSecret, appAlg, roomName, username, email, exp } = opts;
  const resolved = resolveHsAlg(appAlg);

  const conference = roomName.normalize("NFKC").toLowerCase();
  if (!conference.trim() || conference.trim() === "*") {
    throw new Error("A specific conference name is required");
  }
  const header = { alg: resolved.alg, typ: "JWT" };
  const cryptoKey = await generateCryptoKeyHS(appSecret, resolved.hash);
  const payload: Payload = {
    aud: appId,
    iss: appId,
    sub: "*",
    // Jitsi uses the URL-encoded, lower-case room name as its XMPP node.
    room: encodeURIComponent(conference),
    iat: getNumericDate(0),
    exp: opts.expiresAt ?? getNumericDate(exp),
    context: {
      user: {
        name: username,
        email: email,
        ...userContext,
      },
      features: featuresContext,
    },
  };

  return create(header, payload, cryptoKey);
}

// -----------------------------------------------------------------------------
export function generateHostTokenHS(
  opts: HsTokenOptions,
): Promise<string> {
  // coerce empty string to undefined so JWT payload omits the field
  const avatar = opts.avatar === "" ? undefined : opts.avatar;
  return buildTokenHS(
    opts,
    {
      avatar,
      affiliation: "owner",
      moderator: true,
      "lobby_bypass": true,
      "security_bypass": true,
    },
    {
      livestreaming: true,
      recording: true,
      "screen-sharing": true,
    },
  );
}

// -----------------------------------------------------------------------------
export function generateGuestTokenHS(
  opts: HsTokenOptions,
): Promise<string> {
  // coerce empty string to undefined so JWT payload omits the field
  const avatar = opts.avatar === "" ? undefined : opts.avatar;
  return buildTokenHS(
    opts,
    {
      avatar,
      affiliation: "member",
      moderator: false,
    },
    {
      "screen-sharing": true,
    },
  );
}
