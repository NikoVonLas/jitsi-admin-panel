# jitsi-admin-panel

Admin panel for managing Jitsi Meet instances. Monorepo: Deno backend + React frontend.

## Stack

| Service | Tech          | Port            |
|---------|---------------|-----------------|
| api-adm | Deno REST API | 8000 (internal) |
| api-pri | Deno REST API | 8001 (internal) |
| api-pub | Deno REST API | 8002 (internal) |
| ui      | React / Caddy | 80, 443         |
| db      | PostgreSQL 17 | — (internal)    |

## Commands

```sh
docker compose up                  # full stack
docker compose up <service>        # single service
deno run --allow-all index-adm.ts  # admin API (from api/)
npm run dev                        # frontend dev (from frontend/)
npm run build                      # production build
npm run format                     # prettier
npm run i18n:lint                  # i18n key coverage
```

## Architecture

See ARCHITECTURE.md in this root for the current service map, communication
flows, and decision rationale.

## Rules (enforced always)

1. Plan before code. Before writing any code, draft a plan and confirm it
   with the user. Do this even if plan mode is not enabled — treat every
   coding task as plan-first.

2. Conventional commits. All commit messages follow the Conventional Commits
   spec: `type(scope): description`. Types: `feat`, `fix`, `chore`,
   `refactor`, `docs`, `test`, `ci`.

3. Update README selectively. Update README.md only when the change affects
   something already documented there (setup steps, commands, env vars,
   service table) or introduces something fundamental. Skip for minor
   internal changes — no doc churn.

4. Update ARCHITECTURE.md. After any architecture change (new service, new
   port, new dependency, changed data flow), update ARCHITECTURE.md in this
   root.

5. Tests for all new code. Write tests for every new piece of code —
   features, bug fixes, utilities, refactors that change observable
   behaviour. No new code ships without a test.

6. Remember → write here + push. When the user says "remember X", add it to
   the ## Memory section below and push this file to main.

7. Undercover Mode. No AI fingerprints — no Co-Authored-By, no Claude/AI
   mentions in commits, PR descriptions, code comments, or any file in the
   repo. Write as a human dev would.

8. Trunk-based development. Work in short-lived feature branches merged to
   main via PRs. Branches must be very short-lived — ideally merged the same
   day, never more than a few days. main must always remain in a deployable
   state.

9. Feature flags for incomplete or unreleased code. Any feature that is not
   fully implemented, not tested, or not ready for users must be hidden
   behind a feature flag. Never land half-finished or untested functionality
   on main without a flag. When a feature is ready to release, ask the
   developer whether to remove the flag and roll it out before doing so.

## Memory

<!-- Remembered facts are added here on request and pushed to main. -->

- Before every push run all of these locally and fix any failures:
  1. `deno fmt --check api/ && deno lint api/`
  2. `npm run build` (frontend)
  3. `npm run i18n:lint` (frontend)
  4. `npm run test:coverage` (frontend — requires Node 20 via nvm)
  API tests require PostgreSQL and are verified in CI only.
