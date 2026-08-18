# jitsi-admin-panel

Admin panel for managing Jitsi Meet instances. Monorepo: Deno backend + React frontend.

## Stack

| Service | Tech          | Port            |
|---------|---------------|-----------------|
| api-adm | Deno REST API | 8000 (internal) |
| api-pri | Deno REST API | 8001 (internal) |
| api-pub | Deno REST API | 8002 (internal) |
| web     | Caddy + React | 80, 443         |
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

## Rules (enforced always, except if user said ignores it)

1. Plan before code. Before writing any code, draft a plan and confirm it with the user. Ask for as many clarifications as necessary to get the full picture.
   Do this even if plan mode is not enabled — treat every coding task as plan-first.
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
5. TDD. Tests before all new code and for all changed code. Write Unit/Browser tests for every new piece of code — listeners, managers, handlers, bug fixes. No new code ships without a test. Run tests to verify. 80% coverage minimum.
6. Remember → write here + push. When the user says "remember X", add it to the current section and push this file to main.
7. Undercover Mode. No AI fingerprints — no Co-Authored-By, no Claude/AI
   mentions in commits, PR descriptions, code comments, or any file in the
   repo. Write as a human dev would.
9. Check the information in this file for accuracy; if you spot any discrepancies or find something that needs fixing, ask the user whether it should be corrected.
10. Semantic versioning. Major for backward breaking changes. Minor for new functions. Patch for fixes.