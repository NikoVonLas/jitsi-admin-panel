#!/bin/sh
set -e

mkdir -p /data/logo /data/favicons /data/avatars
chown -R deno:deno /data

exec runuser -u deno -- deno run \
  --allow-net \
  --allow-env \
  --allow-read \
  --allow-write=/data/avatars,/data/favicons,/data/logo,/tmp \
  --allow-ffi \
  index-pri.ts
