import { decodeBase64 } from "@std/encoding";
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
  avatar?: string;
}

export interface JaasTokenOptions {
  jaasAppId: string;
  jaasKid: string;
  jaasKey: string;
  jaasAlg: string;
  jaasAud: string;
  jaasIss: string;
  roomName: string;
  username: string;
  email: string;
  exp: number;
}

// -----------------------------------------------------------------------------
function resolveHsAlg(alg: string): { alg: Algorithm; hash: string } {
  if (alg === "HS512") return { alg: "HS512", hash: "SHA-512" };
  return { alg: "HS256", hash: "SHA-256" };
}

// -----------------------------------------------------------------------------
function resolveRsAlg(alg: string): { alg: Algorithm; hash: string } {
  if (alg === "RS512") return { alg: "RS512", hash: "SHA-512" };
  return { alg: "RS256", hash: "SHA-256" };
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
async function generateCryptoKeyRS(
  privateKey: string,
  hash: string,
): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKey.substring(
    pemHeader.length,
    privateKey.length - pemFooter.length,
  );
  const pemStr = pemContents.replaceAll("\n", "");
  const binaryDer = decodeBase64(pemStr);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: hash },
    true,
    ["sign"],
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

  const header = { alg: resolved.alg, typ: "JWT" };
  const cryptoKey = await generateCryptoKeyHS(appSecret, resolved.hash);
  const payload: Payload = {
    aud: appId,
    iss: appId,
    sub: "*",
    room: roomName,
    iat: getNumericDate(0),
    exp: getNumericDate(exp),
    context: {
      user: {
        name: username,
        email: email,
        ...userContext,
      },
      features: featuresContext,
    },
  };

  return await create(header, payload, cryptoKey);
}

// -----------------------------------------------------------------------------
async function buildTokenJaas(
  opts: JaasTokenOptions,
  userContext: Record<string, unknown>,
  featuresContext: Record<string, unknown>,
): Promise<string> {
  const {
    jaasAppId,
    jaasKid,
    jaasKey,
    jaasAlg,
    jaasAud,
    jaasIss,
    roomName,
    username,
    email,
    exp,
  } = opts;
  const resolved = resolveRsAlg(jaasAlg);

  const header = { alg: resolved.alg, typ: "JWT", kid: jaasKid };
  const cryptoKey = await generateCryptoKeyRS(jaasKey, resolved.hash);
  const payload: Payload = {
    aud: jaasAud,
    iss: jaasIss,
    sub: jaasAppId,
    room: roomName,
    iat: getNumericDate(0),
    exp: getNumericDate(exp),
    context: {
      user: {
        name: username,
        email: email,
        ...userContext,
      },
      features: featuresContext,
    },
  };

  return await create(header, payload, cryptoKey);
}

// -----------------------------------------------------------------------------
export async function generateHostTokenHS(
  opts: HsTokenOptions,
): Promise<string> {
  const avatar = opts.avatar || undefined;
  return await buildTokenHS(
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
export async function generateGuestTokenHS(
  opts: HsTokenOptions,
): Promise<string> {
  const avatar = opts.avatar || undefined;
  return await buildTokenHS(
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

// -----------------------------------------------------------------------------
export async function generateHostTokenJaas(
  opts: JaasTokenOptions,
): Promise<string> {
  return await buildTokenJaas(
    opts,
    {
      affiliation: "owner",
      moderator: true,
    },
    {
      livestreaming: true,
      recording: true,
      transcription: true,
      "screen-sharing": true,
      "sip-inbound-call": true,
      "sip-outbound-call": true,
    },
  );
}

// -----------------------------------------------------------------------------
export async function generateGuestTokenJaas(
  opts: JaasTokenOptions,
): Promise<string> {
  return await buildTokenJaas(
    opts,
    {
      affiliation: "member",
      moderator: false,
    },
    {
      "screen-sharing": true,
    },
  );
}
