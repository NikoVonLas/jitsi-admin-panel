const encoder = new TextEncoder();

export interface OidcJwk extends JsonWebKey {
  kid?: string;
  alg?: string;
  use?: string;
}

export interface Jwks {
  keys: OidcJwk[];
}

export interface VerifyOidcJwtOptions {
  issuer: string;
  audience?: string;
  nonce?: string;
  now?: number;
  requireSubject?: boolean;
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - normalized.length % 4) % 4),
    "=",
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJson(value: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

function rsaAlgorithm(alg: string): {
  importAlgorithm: RsaHashedImportParams;
  verifyAlgorithm: AlgorithmIdentifier | RsaPssParams;
} {
  const hash = alg.endsWith("256")
    ? "SHA-256"
    : alg.endsWith("384")
    ? "SHA-384"
    : "SHA-512";
  if (["RS256", "RS384", "RS512"].includes(alg)) {
    return {
      importAlgorithm: { name: "RSASSA-PKCS1-v1_5", hash },
      verifyAlgorithm: { name: "RSASSA-PKCS1-v1_5" },
    };
  }
  if (["PS256", "PS384", "PS512"].includes(alg)) {
    return {
      importAlgorithm: { name: "RSA-PSS", hash },
      verifyAlgorithm: {
        name: "RSA-PSS",
        saltLength: Number(hash.slice(-3)) / 8,
      },
    };
  }
  throw new Error("unsupported OIDC signing algorithm");
}

function validateClaims(
  claims: Record<string, unknown>,
  options: VerifyOidcJwtOptions,
): void {
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const skew = 60;
  if (claims.iss !== options.issuer) throw new Error("invalid token issuer");
  if (
    options.requireSubject !== false &&
    (typeof claims.sub !== "string" || !claims.sub)
  ) {
    throw new Error("missing token subject");
  }
  if (typeof claims.exp !== "number" || claims.exp < now - skew) {
    throw new Error("expired token");
  }
  if (typeof claims.nbf === "number" && claims.nbf > now + skew) {
    throw new Error("token is not active");
  }
  if (typeof claims.iat === "number" && claims.iat > now + skew) {
    throw new Error("token issued in the future");
  }

  if (options.audience) {
    const audiences = typeof claims.aud === "string"
      ? [claims.aud]
      : Array.isArray(claims.aud)
      ? claims.aud.filter((value): value is string => typeof value === "string")
      : [];
    if (!audiences.includes(options.audience)) {
      throw new Error("invalid token audience");
    }
    if (
      audiences.length > 1 && claims.azp !== undefined &&
      claims.azp !== options.audience
    ) throw new Error("invalid authorized party");
  }

  if (options.nonce !== undefined && claims.nonce !== options.nonce) {
    throw new Error("invalid token nonce");
  }
}

export async function verifyOidcJwt(
  token: string,
  jwks: Jwks,
  options: VerifyOidcJwtOptions,
): Promise<Record<string, unknown>> {
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new Error("malformed OIDC token");
  }

  const header = decodeJson(parts[0]);
  const claims = decodeJson(parts[1]);
  if (typeof header.alg !== "string" || typeof header.kid !== "string") {
    throw new Error("invalid OIDC token header");
  }
  const jwk = jwks.keys.find((key) => key.kid === header.kid);
  if (!jwk || (jwk.use && jwk.use !== "sig")) {
    throw new Error("OIDC signing key not found");
  }
  if (jwk.alg && jwk.alg !== header.alg) {
    throw new Error("OIDC signing algorithm mismatch");
  }

  const algorithm = rsaAlgorithm(header.alg);
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    algorithm.importAlgorithm,
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    algorithm.verifyAlgorithm,
    key,
    decodeBase64Url(parts[2]),
    encoder.encode(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) throw new Error("invalid OIDC token signature");

  validateClaims(claims, options);
  return claims;
}
