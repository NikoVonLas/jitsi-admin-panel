-- OIDC providers table (replaces per-setting oidc_* keys)
CREATE TABLE IF NOT EXISTS oidc_provider (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" varchar(250) NOT NULL DEFAULT 'SSO',
    "issuer_url" varchar(500) NOT NULL,
    "client_id" varchar(250) NOT NULL,
    "client_secret" varchar(500) NOT NULL DEFAULT '',
    "scopes" varchar(250) NOT NULL DEFAULT 'openid profile email',
    "enabled" boolean NOT NULL DEFAULT true,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Migrate existing OIDC config from setting table (if present)
INSERT INTO oidc_provider (name, issuer_url, client_id, client_secret, scopes)
SELECT
    'SSO' AS name,
    (SELECT mvalue FROM setting WHERE mkey = 'oidc_issuer_url' LIMIT 1) AS issuer_url,
    (SELECT mvalue FROM setting WHERE mkey = 'oidc_client_id' LIMIT 1) AS client_id,
    COALESCE((SELECT mvalue FROM setting WHERE mkey = 'oidc_client_secret' LIMIT 1), '') AS client_secret,
    COALESCE((SELECT mvalue FROM setting WHERE mkey = 'oidc_scopes' LIMIT 1), 'openid profile email') AS scopes
WHERE
    (SELECT mvalue FROM setting WHERE mkey = 'oidc_issuer_url' LIMIT 1) IS NOT NULL
    AND (SELECT mvalue FROM setting WHERE mkey = 'oidc_issuer_url' LIMIT 1) != ''
    AND (SELECT mvalue FROM setting WHERE mkey = 'oidc_client_id' LIMIT 1) IS NOT NULL
    AND (SELECT mvalue FROM setting WHERE mkey = 'oidc_client_id' LIMIT 1) != '';
