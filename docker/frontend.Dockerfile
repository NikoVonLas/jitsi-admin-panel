FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json /app/
RUN npm ci

COPY frontend/ /app/
RUN npm run build

FROM caddy:alpine

COPY --from=builder /app/build /srv
COPY Caddyfile /etc/caddy/Caddyfile
