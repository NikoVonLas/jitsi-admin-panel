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
- **OIDC + local auth** — sign in via any OIDC provider or with email/password
- **Intercom** — real-time in-app messaging between users (SSE-based)
- **Avatar & favicon** — per-domain branding (custom logos and favicons)
- **Jitsi token generation** — server-side HS256/HS512 (self-hosted) and RS256/RS512 (JaaS)

## Requirements

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/)
- A publicly accessible domain with DNS pointed to your server (required for Let's Encrypt TLS)
  - For local use, `localhost` (internal CA) or `:80` (plain HTTP) work without a domain

## Quick Start

```sh
git clone https://github.com/NikoVonLas/jitsi-admin-panel.git
cd jitsi-admin-panel
cp .env.example .env          # fill in required values (see Configuration below)
docker compose up -d
```

Open `https://<APP_FQDN>` in your browser. The first local account to sign up becomes the superadmin.

## Configuration

All configuration is done via environment variables. Copy `.env.example` to `.env` and edit it before starting.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_PASSWD` | Yes | `changeme` | PostgreSQL password |
| `API_SECRET` | Yes | — | Secret key for JWT signing — use a strong random string |
| `APP_FQDN` | Yes | `localhost` | Public domain (`example.com`), `localhost` for local TLS, or `:80` for plain HTTP |
| `AUTH_LOCAL` | No | `true` | Enable email/password login |
| `ALLOW_UNSECURE_CERT` | No | `false` | Skip TLS certificate verification (dev only) |
| `API_TIMEOUT` | No | `30000` | API request timeout in milliseconds |
| `CONTACT_EMAIL` | No | — | Contact email shown in the UI |
| `MAILER_HOST` | No | — | SMTP host (required for email reminders) |
| `MAILER_PORT` | No | `465` | SMTP port |
| `MAILER_SECURE` | No | `true` | Use TLS for SMTP |
| `MAILER_USER` | No | — | SMTP username |
| `MAILER_PASS` | No | — | SMTP password |
| `MAILER_FROM` | No | — | Sender address for outgoing emails |

## Architecture

All traffic enters through Caddy (`ui`), which is the single public entry point and reverse proxy.

```
                ┌─────────────────────────────────────────┐
                │          Docker network: intranet        │
Browser ──443───► ui (Caddy)  ──/api/adm/──► api-adm:8000 │
                │             ──/api/pri/──► api-pri:8001  │
                │             ──/api/pub/──► api-pub:8002  │
                │                               │          │
                │             / (SPA fallback)  ▼          │
                │                           db:5432         │
                └─────────────────────────────────────────┘
```

| Service | Description |
|---|---|
| `api-adm` | Auth gateway and control plane. Runs DB migrations and housekeeping. Superadmin-only. |
| `api-pri` | Main worker. All routes require a valid JWT. Covers rooms, meetings, schedules, intercom. |
| `api-pub` | Fully public, no auth. Serves avatars, favicons, iCal files, and guest join pages. |
| `ui` | React 19 SPA served by Caddy. Caddy handles TLS and reverse-proxies all `/api/*` routes. |
| `db` | PostgreSQL 17. Schema initialised on first boot; further migrations run automatically. |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full service map, data flow, and design decisions.

## Development

```sh
# Backend (from api/)
deno run --allow-all index-adm.ts   # admin API on :8000
deno run --allow-all index-pri.ts   # private API on :8001
deno run --allow-all index-pub.ts   # public API on :8002

# Frontend (from frontend/)
npm install
npm run dev          # dev server (Vite)
npm run build        # production build
npm run format       # Prettier
npm run i18n:lint    # check i18n key coverage
```

## CI

| Workflow | Trigger | What it does |
|---|---|---|
| **CI** | Every push / PR | Deno lint & format check, frontend build, i18n lint, SonarCloud analysis |
| **Release** | Tag `v*.*.*` | Builds and pushes Docker images to GHCR (`ghcr.io/nikovonlas/jitsi-admin-panel/*`) |

## License

[MIT](./LICENSE)
