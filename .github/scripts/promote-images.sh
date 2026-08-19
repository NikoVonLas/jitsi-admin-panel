#!/usr/bin/env sh
set -eu

: "${IMAGE_PREFIX:?Set IMAGE_PREFIX (for example ghcr.io/owner/project)}"
: "${IMAGE_TAG:?Set IMAGE_TAG (for example v1.2.3)}"

DOCKER_BIN="${DOCKER_BIN:-docker}"
PROMOTION_RETRIES="${PROMOTION_RETRIES:-3}"
SERVICES="api-adm api-pri api-pub web"

if ! printf '%s\n' "$IMAGE_TAG" | grep -Eq '^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'; then
  echo "IMAGE_TAG must be a stable semantic version such as v1.2.3" >&2
  exit 2
fi

case "$IMAGE_PREFIX" in
  */ | *[!a-zA-Z0-9._:/-]*)
    echo "IMAGE_PREFIX contains unsupported characters or a trailing slash" >&2
    exit 2
    ;;
esac

case "$PROMOTION_RETRIES" in
  '' | *[!0-9]* | 0)
    echo "PROMOTION_RETRIES must be a positive integer" >&2
    exit 2
    ;;
esac

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to promote images" >&2
  exit 2
fi

STATE_DIR="$(mktemp -d)"
CANDIDATES_FILE="$STATE_DIR/candidates"
PREVIOUS_FILE="$STATE_DIR/previous"

cleanup() {
  if [ -n "${STATE_DIR:-}" ] && [ -d "$STATE_DIR" ]; then
    rm -rf -- "$STATE_DIR"
  fi
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

manifest_digest() {
  manifest="$("$DOCKER_BIN" buildx imagetools inspect "$1" --format '{{json .Manifest}}')" || return 1
  printf '%s\n' "$manifest" |
    jq --exit-status --raw-output '.digest | select(test("^sha256:[0-9a-f]{64}$"))'
}

lookup_digest() {
  awk -v service="$1" '$1 == service { print $2 }' "$2"
}

copy_with_retry() {
  target="$1"
  source="$2"
  attempt=1

  while ! "$DOCKER_BIN" buildx imagetools create --prefer-index=false --tag "$target" "$source"; do
    if [ "$attempt" -ge "$PROMOTION_RETRIES" ]; then
      return 1
    fi
    attempt=$((attempt + 1))
    echo "Retrying promotion of $target ($attempt/$PROMOTION_RETRIES)" >&2
    sleep 2
  done
}

rollback() {
  rollback_services="$1"
  rollback_failed=false

  echo "Promotion failed; restoring previous latest image digests" >&2
  for service in $rollback_services; do
    image="$IMAGE_PREFIX/$service"
    previous_digest="$(lookup_digest "$service" "$PREVIOUS_FILE")"
    if [ "$previous_digest" = none ]; then
      echo "No previous $image:latest exists (initial release cannot be restored)" >&2
      rollback_failed=true
    elif ! copy_with_retry "$image:latest" "$image@$previous_digest"; then
      echo "Could not restore $image:latest to $previous_digest" >&2
      rollback_failed=true
    fi
  done

  if [ "$rollback_failed" = true ]; then
    echo "Rollback was incomplete; inspect GHCR tags before retrying the release" >&2
  else
    echo "Previous latest image set restored" >&2
  fi
}

: >"$CANDIDATES_FILE"
: >"$PREVIOUS_FILE"

for service in $SERVICES; do
  image="$IMAGE_PREFIX/$service"
  candidate_digest="$(manifest_digest "$image:$IMAGE_TAG")" || {
    echo "Candidate image is missing or invalid: $image:$IMAGE_TAG" >&2
    exit 1
  }
  printf '%s %s\n' "$service" "$candidate_digest" >>"$CANDIDATES_FILE"

  if previous_digest="$(manifest_digest "$image:latest" 2>/dev/null)"; then
    printf '%s %s\n' "$service" "$previous_digest" >>"$PREVIOUS_FILE"
  else
    printf '%s none\n' "$service" >>"$PREVIOUS_FILE"
  fi
done

promoted_services=""
for service in $SERVICES; do
  image="$IMAGE_PREFIX/$service"
  promoted_services="$promoted_services $service"
  if ! copy_with_retry "$image:latest" "$image:$IMAGE_TAG"; then
    rollback "$promoted_services"
    exit 1
  fi
done

for service in $SERVICES; do
  image="$IMAGE_PREFIX/$service"
  expected_digest="$(lookup_digest "$service" "$CANDIDATES_FILE")"
  actual_digest="$(manifest_digest "$image:latest")" || actual_digest=missing
  if [ "$actual_digest" != "$expected_digest" ]; then
    echo "$image:latest does not match $image:$IMAGE_TAG" >&2
    rollback "$SERVICES"
    exit 1
  fi
done

echo "Promoted $IMAGE_TAG to latest for: $SERVICES"
