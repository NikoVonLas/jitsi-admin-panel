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
    COMPOSE_PROFILE_ARGS=""
    STACK_SERVICES="db api-adm api-pri api-pub web prosody jicofo jvb jitsi-web"
    ;;
  keycloak)
    export E2E_MODE=keycloak
    export E2E_AUTH_LOCAL=false
    export E2E_OIDC_CLIENT_ID=jitsi-admin-e2e
    export E2E_OIDC_CLIENT_SECRET=e2e-client-secret
    export E2E_OIDC_ISSUER_URL=http://keycloak:8080/realms/jitsi
    COMPOSE_PROFILE_ARGS="--profile keycloak"
    STACK_SERVICES="db keycloak api-adm api-pri api-pub web prosody jicofo jvb jitsi-web"
    ;;
  *)
    echo "usage: $0 local|keycloak" >&2
    exit 2
    ;;
esac

PROJECT_NAME="jitsi-admin-e2e-$MODE"
COMPOSE_FILE="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)/docker-compose.e2e.yml"

cleanup() {
  docker compose --project-name "$PROJECT_NAME" --file "$COMPOSE_FILE" $COMPOSE_PROFILE_ARGS down --volumes --remove-orphans
}

trap cleanup EXIT INT TERM
cleanup

docker compose \
  --project-name "$PROJECT_NAME" \
  --file "$COMPOSE_FILE" \
  $COMPOSE_PROFILE_ARGS \
  build

docker compose \
  --project-name "$PROJECT_NAME" \
  --file "$COMPOSE_FILE" \
  $COMPOSE_PROFILE_ARGS \
  up --detach --wait $STACK_SERVICES

docker compose \
  --project-name "$PROJECT_NAME" \
  --file "$COMPOSE_FILE" \
  $COMPOSE_PROFILE_ARGS \
  run --rm --no-deps e2e
