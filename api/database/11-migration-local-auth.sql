-- local identity (email + password hash)
CREATE TABLE IF NOT EXISTS identity_local (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "identity_id" uuid NOT NULL REFERENCES identity(id) ON DELETE CASCADE,
    "email" varchar(250) NOT NULL,
    "password_hash" varchar(500) NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ON identity_local("email");
ALTER TABLE identity_local OWNER TO jitsi;
