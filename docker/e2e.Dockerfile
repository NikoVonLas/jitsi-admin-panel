FROM node:20-bookworm AS dependencies

WORKDIR /work/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM mcr.microsoft.com/playwright:v1.62.1-noble

WORKDIR /work/frontend

COPY --from=dependencies /work/frontend/node_modules ./node_modules
COPY frontend/ ./
RUN chown -R pwuser:pwuser /work/frontend

USER pwuser
ENTRYPOINT ["npx", "playwright", "test"]
