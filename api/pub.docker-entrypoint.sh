#!/bin/sh
set -e

mkdir -p /data/logo /data/favicons /data/avatars
chown -R deno:deno /data

exec runuser -u deno -- deno run \
  --allow-net \
  --allow-env \
  --allow-read=/data/avatars,/data/favicons,/data/logo \
  index-pub.ts
