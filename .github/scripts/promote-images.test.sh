#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
PROMOTE_SCRIPT="$SCRIPT_DIR/promote-images.sh"
TEST_DIR="$(mktemp -d)"
FAKE_BIN="$TEST_DIR/bin"
FAKE_STATE="$TEST_DIR/state"
FAKE_DOCKER_LOG="$TEST_DIR/docker.log"

cleanup() {
  if [ -n "${TEST_DIR:-}" ] && [ -d "$TEST_DIR" ]; then
    rm -rf -- "$TEST_DIR"
  fi
}

trap cleanup EXIT INT TERM
mkdir -p "$FAKE_BIN" "$FAKE_STATE"

cat >"$FAKE_BIN/docker" <<'EOF'
#!/usr/bin/env sh
set -eu

printf '%s\n' "$*" >>"$FAKE_DOCKER_LOG"

service_from_ref() {
  printf '%s\n' "$1" | sed -E 's#^.*/([^/:]+)([:@].*)$#\1#'
}

candidate_digest() {
  case "$1" in
    api-adm) char=a ;;
    api-pri) char=b ;;
    api-pub) char=c ;;
    web) char=d ;;
    *) exit 1 ;;
  esac
  printf 'sha256:'
  printf '%64s' '' | tr ' ' "$char"
  printf '\n'
}

previous_digest() {
  case "$1" in
    api-adm) char=1 ;;
    api-pri) char=2 ;;
    api-pub) char=3 ;;
    web) char=4 ;;
    *) exit 1 ;;
  esac
  printf 'sha256:'
  printf '%64s' '' | tr ' ' "$char"
  printf '\n'
}

case "$1 $2 $3" in
  "buildx imagetools inspect")
    ref="$4"
    service="$(service_from_ref "$ref")"
    case "$ref" in
      *:"$IMAGE_TAG") digest="$(candidate_digest "$service")" ;;
      *:latest)
        if [ -f "$FAKE_STATE/$service.promoted" ]; then
          digest="$(candidate_digest "$service")"
        else
          digest="$(previous_digest "$service")"
        fi
        ;;
      *) exit 1 ;;
    esac
    printf '{"digest":"%s"}\n' "$digest"
    ;;
  "buildx imagetools create")
    shift 3
    target=
    source=
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --prefer-index=false) shift ;;
        --tag)
          target="$2"
          shift 2
          ;;
        *)
          source="$1"
          shift
          ;;
      esac
    done
    test -n "$target"
    test -n "$source"
    service="$(service_from_ref "$target")"
    if [ "${FAKE_FAIL_SERVICE:-}" = "$service" ] && [ "$source" = "$IMAGE_PREFIX/$service:$IMAGE_TAG" ]; then
      exit 1
    fi
    case "$source" in
      *@sha256:*) rm -f "$FAKE_STATE/$service.promoted" ;;
      *:"$IMAGE_TAG") : >"$FAKE_STATE/$service.promoted" ;;
      *) exit 1 ;;
    esac
    ;;
  *) exit 1 ;;
esac
EOF
chmod +x "$FAKE_BIN/docker"

run_promote() {
  PATH="$FAKE_BIN:$PATH" \
    DOCKER_BIN=docker \
    FAKE_DOCKER_LOG="$FAKE_DOCKER_LOG" \
    FAKE_STATE="$FAKE_STATE" \
    IMAGE_PREFIX=ghcr.io/example/panel \
    IMAGE_TAG=v1.2.3 \
    PROMOTION_RETRIES=1 \
    "$PROMOTE_SCRIPT"
}

run_promote >/dev/null
for service in api-adm api-pri api-pub web; do
  test -f "$FAKE_STATE/$service.promoted"
  grep -F "imagetools create --prefer-index=false --tag ghcr.io/example/panel/$service:latest ghcr.io/example/panel/$service:v1.2.3" "$FAKE_DOCKER_LOG" >/dev/null
done

rm -f "$FAKE_STATE"/*.promoted
: >"$FAKE_DOCKER_LOG"
if FAKE_FAIL_SERVICE=api-pub run_promote >/dev/null 2>&1; then
  echo "promotion failure should return a non-zero status" >&2
  exit 1
fi
grep -F "api-adm:latest ghcr.io/example/panel/api-adm@sha256:1111111111111111111111111111111111111111111111111111111111111111" "$FAKE_DOCKER_LOG" >/dev/null
grep -F "api-pri:latest ghcr.io/example/panel/api-pri@sha256:2222222222222222222222222222222222222222222222222222222222222222" "$FAKE_DOCKER_LOG" >/dev/null
grep -F "api-pub:latest ghcr.io/example/panel/api-pub@sha256:3333333333333333333333333333333333333333333333333333333333333333" "$FAKE_DOCKER_LOG" >/dev/null
if grep -F "web:latest ghcr.io/example/panel/web:v1.2.3" "$FAKE_DOCKER_LOG" >/dev/null; then
  echo "promotion must stop after the first failed image" >&2
  exit 1
fi

if PATH="$FAKE_BIN:$PATH" IMAGE_PREFIX=ghcr.io/example/panel IMAGE_TAG=1.2.3 "$PROMOTE_SCRIPT" >/dev/null 2>&1; then
  echo "a release tag without the v prefix must be rejected" >&2
  exit 1
fi

echo "promotion script tests passed"
