FROM denoland/deno:2.8.3

WORKDIR /app

COPY api/ /app
RUN deno cache /app/index-adm.ts && chmod +x /app/adm.docker-entrypoint.sh

USER deno
EXPOSE 8000
ENTRYPOINT ["/app/adm.docker-entrypoint.sh"]
