#!/usr/bin/env sh
set -eu

MODE="${1:-}"

case "$MODE" in
  local)
    export E2E_MODE=local
    export E2E_AUTH_LOCAL=true
    export E2E_OIDC_CLIENT_ID=
    export E2E_OIDC_CLIENT_SECRET=
    export E2E_OIDC_ISSUER_URL=
    set -- mailpit db api-adm api-pri api-pub web prosody jicofo jvb jitsi-web
    ;;
  keycloak)
    export E2E_MODE=keycloak
    export E2E_AUTH_LOCAL=false
    export E2E_OIDC_CLIENT_ID=jitsi-admin-e2e
    export E2E_OIDC_CLIENT_SECRET=e2e-client-secret
    export E2E_OIDC_ISSUER_URL=http://keycloak:8080/realms/jitsi
    set -- mailpit db keycloak api-adm api-pri api-pub web prosody jicofo jvb jitsi-web
    ;;
  *)
    echo "usage: $0 local|keycloak" >&2
    exit 2
    ;;
esac

PROJECT_NAME="jitsi-admin-e2e-$MODE"
PROJECT_ROOT="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.e2e.yml"
RESULTS_DIR="$PROJECT_ROOT/frontend/test-results"

# Docker creates a missing bind-mount directory as root. Prepare it explicitly
# so the non-root Playwright user can write reports on a clean CI checkout.
mkdir -p "$RESULTS_DIR"
chmod 0777 "$RESULTS_DIR"

compose() {
  if [ "$MODE" = keycloak ]; then
    docker compose --project-name "$PROJECT_NAME" --file "$COMPOSE_FILE" --profile keycloak "$@"
  else
    docker compose --project-name "$PROJECT_NAME" --file "$COMPOSE_FILE" "$@"
  fi
}

compose_cleanup() {
  compose down --volumes --remove-orphans
}

on_exit() {
  status=$?
  trap - EXIT INT TERM
  if [ "$status" -ne 0 ]; then
    compose logs --no-color --tail 200 api-adm mailpit keycloak || true
  fi
  compose_cleanup
  exit "$status"
}

trap on_exit EXIT INT TERM
compose_cleanup

compose build
compose up --detach --wait "$@"
compose run --rm --no-deps e2e
