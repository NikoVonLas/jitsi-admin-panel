FROM denoland/deno:2.8.3

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends fontconfig=2.15.0-2.3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY api/ /app
RUN deno cache /app/index-pri.ts && chmod +x /app/pri.docker-entrypoint.sh

EXPOSE 8001
ENTRYPOINT ["/app/pri.docker-entrypoint.sh"]
