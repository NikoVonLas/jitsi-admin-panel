# Jitsi Admin Panel

[![CI](https://github.com/NikoVonLas/jitsi-admin-panel/actions/workflows/ci.yml/badge.svg)](https://github.com/NikoVonLas/jitsi-admin-panel/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/NikoVonLas/jitsi-admin-panel)](https://github.com/NikoVonLas/jitsi-admin-panel/releases/latest)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=NikoVonLas_jitsi-admin-panel&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=NikoVonLas_jitsi-admin-panel)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=NikoVonLas_jitsi-admin-panel&metric=coverage)](https://sonarcloud.io/summary/new_code?id=NikoVonLas_jitsi-admin-panel)

Self-hosted admin panel for [Jitsi Meet](https://jitsi.org/) — manage domains, rooms, schedules, and users through a single web UI with support for local and OIDC authentication.

## Features

- **Multi-domain support** — manage multiple Jitsi Meet instances from one panel
- **Room management** — create and configure rooms with custom settings per domain
- **Meeting scheduling** — schedule meetings with iCal export and email reminders
- **Guest join pages** — public, auth-free pages for guests to join meetings
- **Keycloak OIDC + local auth** — sign in through Keycloak or with email/password
- **Avatar & favicon** — per-domain branding (custom logos and favicons)
- **Jitsi token generation** — server-side HS256/HS512 for self-hosted Jitsi

## Requirements

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/)
- A publicly accessible domain with DNS pointed to your server (required for Let's Encrypt TLS)
  - For local use, `localhost` works with Caddy's internal CA or plain HTTP
- Node.js 20 for local frontend development and tests

## Quick Start

### Production (pre-built images from GHCR)

```sh
curl -O https://raw.githubusercontent.com/NikoVonLas/jitsi-admin-panel/main/docker-compose.prod.yml
curl -O https://raw.githubusercontent.com/NikoVonLas/jitsi-admin-panel/main/.env.example
cp .env.example .env          # fill in required values (see Configuration below)
# generate independent values for DB_PASSWD and API_SECRET, for example:
openssl rand -hex 32
docker compose -f docker-compose.prod.yml up -d
```

### Development (build from source)

```sh
git clone https://github.com/NikoVonLas/jitsi-admin-panel.git
cd jitsi-admin-panel
cp .env.example .env
docker compose up -d          # builds all images locally
```

On the first start, `api-adm` initializes an empty PostgreSQL volume and applies
all migrations before the other API services start.

Open `https://<APP_FQDN>` in your browser. When local authentication is enabled,
the first local account to sign up becomes the superadmin.

## Configuration

All configuration is done via environment variables. Copy `.env.example` to `.env` and edit it before starting.

| Variable                | Required            | Default                | Description                                                                   |
| ----------------------- | ------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `DB_NAME`               | No                  | `jitsi`                | PostgreSQL database name                                                      |
| `DB_USER`               | No                  | `jitsi`                | PostgreSQL user                                                               |
| `DB_PASSWD`             | Yes                 | —                      | PostgreSQL password                                                           |
| `DB_PORT`               | No                  | `5432`                 | PostgreSQL port inside the Compose network                                    |
| `DB_POOL_SIZE`          | No                  | `8`                    | Connection pool size per API process                                          |
| `API_SECRET`            | Yes                 | —                      | JWT signing key, at least 32 characters; generate with `openssl rand -hex 32` |
| `APP_FQDN`              | Yes                 | `localhost`            | Public hostname with optional port, without a URL scheme                      |
| `APP_SCHEME`            | No                  | `https`                | Public URL scheme used for links and OIDC callbacks                           |
| `AUTH_LOCAL`            | No                  | `true`                 | Enable email/password login and local-user management                         |
| `ALLOW_UNSECURE_CERT`   | No                  | `false`                | Skip TLS certificate verification (dev only)                                  |
| `SESSION_COOKIE_SECURE` | No                  | `true`                 | Must match the scheme; set `false` only when the panel is served over HTTP    |
| `API_TIMEOUT`           | No                  | `86400`                | Authentication session lifetime in seconds                                    |
| `LANG_UI`               | No                  | `en`                   | Default UI language (`en` or `ru`)                                            |
| `OIDC_PROVIDER_NAME`    | No                  | `Keycloak`             | Display name used when bootstrapping the first OIDC provider                  |
| `OIDC_ISSUER_URL`       | Keycloak-only setup | —                      | Realm issuer URL, for example `https://keycloak.example.com/realms/jitsi`     |
| `OIDC_CLIENT_ID`        | Keycloak-only setup | —                      | OIDC client ID                                                                |
| `OIDC_CLIENT_SECRET`    | No                  | —                      | OIDC client secret; leave empty for a public client                           |
| `OIDC_SCOPES`           | No                  | `openid profile email` | Scopes requested from Keycloak                                                |
| `SUPERADMIN_ROLE`       | No                  | `jitsi-superadmin`     | Keycloak realm role that grants panel superadmin access                       |
| `MAILER_HOST`           | No                  | —                      | SMTP host (required for email reminders)                                      |
| `MAILER_PORT`           | No                  | `465`                  | SMTP port                                                                     |
| `MAILER_SECURE`         | No                  | `true`                 | Use TLS for SMTP                                                              |
| `MAILER_USER`           | No                  | —                      | SMTP username                                                                 |
| `MAILER_PASS`           | No                  | —                      | SMTP password                                                                 |
| `MAILER_FROM`           | No                  | —                      | Sender address for outgoing emails                                            |
| `CADDY_ADDRESS`         | No                  | derived                | Override Caddy's site address; normally derived from scheme and FQDN          |

Compose refuses to start when `DB_PASSWD`, `API_SECRET`, or `APP_FQDN` is
empty. The SMTP password is passed only to `api-adm`, which sends mail; public
and private request-serving containers do not receive it. When using plain
HTTP locally, set both `APP_SCHEME=http` and `SESSION_COOKIE_SECURE=false`.

### Keycloak-only authentication

Create users and assign roles in Keycloak; the panel does not use the Keycloak
Admin REST API. On first login, the panel creates or updates its local
identity/profile from the OIDC `sub`, email, and username claims.

For a fresh installation, set at least:

```env
AUTH_LOCAL=false
OIDC_ISSUER_URL=https://keycloak.example.com/realms/jitsi
OIDC_CLIENT_ID=jitsi-admin
OIDC_CLIENT_SECRET=change-me
SUPERADMIN_ROLE=jitsi-superadmin
```

Configure `https://<APP_FQDN>/oidc/validate` as a valid redirect URI in the
Keycloak client. Assign the `SUPERADMIN_ROLE` realm role to at least one user.
If the database has no OIDC providers, `api-adm` creates the first one from
these variables. Providers subsequently managed through the UI are not
overwritten by environment configuration.

OIDC uses authorization-code flow with signed, short-lived state, PKCE S256,
nonce, and provider JWKS validation. The browser never receives either the
provider tokens or the panel session JWT.

## Architecture

All traffic enters through Caddy (`web`), which is the single public entry point and reverse proxy.

```
                ┌─────────────────────────────────────────┐
                │          Docker network: intranet        │
Browser ──443───► web (Caddy) ──/api/adm/──► api-adm:8000 │
                │             ──/api/pri/──► api-pri:8001  │
                │             ──/api/pub/──► api-pub:8002  │
                │                               │          │
                │             / (SPA fallback)  ▼          │
                │                           db:5432         │
                └─────────────────────────────────────────┘
```

| Service   | Description                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| `api-adm` | Auth gateway and control plane. Initializes/migrates the database, runs housekeeping and sends email reminders.    |
| `api-pri` | Main worker. All routes require a valid session cookie. Covers rooms, meetings, schedules, profiles, and settings. |
| `api-pub` | Fully public, no auth. Serves avatars, favicons, iCal files, and guest join pages.                                 |
| `web`     | Caddy — serves the React 19 SPA as static files and reverse-proxies all `/api/*` routes. Sole public entry point.  |
| `db`      | PostgreSQL 17. Schema initialised on first boot; further migrations run automatically.                             |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full service map, data flow, and design decisions.

## Development

```sh
# Backend (from api/)
deno run --allow-all index-adm.ts   # admin API on :8000
deno run --allow-all index-pri.ts   # private API on :8001
deno run --allow-all index-pub.ts   # public API on :8002

# Frontend (from frontend/)
nvm use              # reads Node 20 from ../.nvmrc
npm install
npm run dev          # dev server (Vite)
npm run build        # production build
npm run format       # Prettier
npm run i18n:lint    # check i18n key coverage
npm run test:e2e     # full Docker E2E: local auth, Keycloak and real Jitsi
```

## Compose files

| File                      | Purpose                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.yml`      | **Development** — builds all images locally from the Dockerfiles in `docker/`. Use when working on the source code.                |
| `docker-compose.prod.yml` | **Production** — pulls pre-built images from GHCR (`ghcr.io/nikovonlas/jitsi-admin-panel/*`). `IMAGE_TAG` selects the release. |
| `docker-compose.e2e.yml`  | **End-to-end tests** — starts empty volumes, all panel services, Mailpit, Keycloak when requested, and a complete Jitsi stack.   |

### End-to-end tests

The E2E suite does not mock authentication or conferencing. It creates users,
domains, and rooms through the browser, then joins the generated room from two
browser contexts. The assertion covers the Jitsi client state and JVB conference
and participant counters. It also schedules a meeting in the reminder window and
verifies the recipient, subject, and meeting link in the email accepted over SMTP.

```sh
cd frontend
npm run test:e2e:local      # local login and user CRUD
npm run test:e2e:keycloak   # Keycloak login/JIT provisioning/logout
npm run test:e2e            # both modes
```

Each run starts from new database and upload volumes and removes the stack on
completion. Docker Compose and enough memory for Keycloak plus the Jitsi stack
are required.

### Auto-updates with Watchtower

`docker-compose.prod.yml` ships with a commented-out [Watchtower](https://containrrr.dev/watchtower/) service. Uncomment it to have Watchtower watch the four app containers and automatically pull updated images whenever a new release is published:

```yaml
# inside docker-compose.prod.yml
watchtower:
  image: containrrr/watchtower:latest
  restart: always
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  environment:
    - WATCHTOWER_CLEANUP=true
    - WATCHTOWER_INCLUDE_RESTARTING=true
  command: --interval 86400 api-adm api-pri api-pub web
```

Adjust `--interval` (seconds) to control how often it checks for updates.

### Releases and rollback

Create a stable semantic-version tag from `main` to start a release:

```sh
git tag v1.2.3
git push origin v1.2.3
```

The release workflow first publishes four candidate images with the immutable
`v1.2.3` tag. It then runs the complete local-auth and Keycloak E2E suites
against those pulled images. Only a candidate that passes both suites is
promoted to `latest` and published as a GitHub Release. A failed build or E2E
run never changes `latest`.

Promotion snapshots the previous `latest` digest of every application image.
If updating or verifying the four tags fails partway through, it retries and
then restores the previous image set. There is no previous set to restore on
the first-ever release, so its candidate E2E checks are the rollback boundary.

Production uses the verified `latest` set by default. Pin an immutable version
for a reproducible deployment or explicit rollback:

```sh
IMAGE_TAG=v1.2.3 docker compose --file docker-compose.prod.yml up --detach
IMAGE_TAG=v1.2.2 docker compose --file docker-compose.prod.yml up --detach
```

Persist `IMAGE_TAG` in `.env` when the deployment must remain pinned. Watchtower
should only be enabled for deployments intentionally following `latest`.

## CI

| Workflow    | Trigger                | What it does                                                                                                                       |
| ----------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **CI**      | Push to `main` / PR | Compose/env validation, release-script tests, Deno lint & format, frontend build, API/frontend tests, full local/Keycloak/Jitsi E2E, SonarCloud analysis |
| **Release** | Tag `v*.*.*`        | Builds versioned candidates, tests the pulled images in both auth modes, promotes the verified set to `latest`, and creates a GitHub Release          |

## License

[MIT](./LICENSE)
