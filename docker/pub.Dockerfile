FROM denoland/deno:2.8.3

WORKDIR /app

COPY api/ /app
RUN deno cache /app/index-pub.ts && chmod +x /app/pub.docker-entrypoint.sh

EXPOSE 8002
ENTRYPOINT ["/app/pub.docker-entrypoint.sh"]
