#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
RUN_SCRIPT="$SCRIPT_DIR/run.sh"
TEST_DIR="$(mktemp -d)"
FAKE_BIN="$TEST_DIR/bin"
FAKE_DOCKER_LOG="$TEST_DIR/docker.log"

cleanup() {
  if [ -n "${TEST_DIR:-}" ] && [ -d "$TEST_DIR" ]; then
    rm -rf -- "$TEST_DIR"
  fi
}

trap cleanup EXIT INT TERM
mkdir -p "$FAKE_BIN"

cat >"$FAKE_BIN/docker" <<'EOF'
#!/usr/bin/env sh
set -eu
printf '%s\n' "$*" >>"$FAKE_DOCKER_LOG"
EOF
chmod +x "$FAKE_BIN/docker"

PATH="$FAKE_BIN:$PATH" \
  FAKE_DOCKER_LOG="$FAKE_DOCKER_LOG" \
  E2E_USE_RELEASE_IMAGES=false \
  "$RUN_SCRIPT" local
grep -F " build" "$FAKE_DOCKER_LOG" >/dev/null
if grep -F "pull api-adm api-pri api-pub web" "$FAKE_DOCKER_LOG" >/dev/null; then
  echo "source E2E must not pull release images" >&2
  exit 1
fi

: >"$FAKE_DOCKER_LOG"
PATH="$FAKE_BIN:$PATH" \
  FAKE_DOCKER_LOG="$FAKE_DOCKER_LOG" \
  E2E_USE_RELEASE_IMAGES=true \
  APP_IMAGE_PREFIX=ghcr.io/example/panel \
  APP_IMAGE_TAG=v1.2.3 \
  "$RUN_SCRIPT" keycloak
grep -F "build e2e" "$FAKE_DOCKER_LOG" >/dev/null
grep -F "pull api-adm api-pri api-pub web" "$FAKE_DOCKER_LOG" >/dev/null
grep -F "up --detach --wait --no-build" "$FAKE_DOCKER_LOG" >/dev/null
grep -F "run --rm --no-deps e2e" "$FAKE_DOCKER_LOG" >/dev/null

if (
  unset APP_IMAGE_PREFIX
  PATH="$FAKE_BIN:$PATH" \
    FAKE_DOCKER_LOG="$FAKE_DOCKER_LOG" \
    E2E_USE_RELEASE_IMAGES=true \
    APP_IMAGE_TAG=v1.2.3 \
    "$RUN_SCRIPT" local >/dev/null 2>&1
); then
  echo "release-image E2E must require APP_IMAGE_PREFIX" >&2
  exit 1
fi

echo "E2E runner tests passed"
