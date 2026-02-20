FROM pramsey/pg_tileserv

# Install curl for healthcheck if not present
RUN apk add --no-cache curl || true

# Copy your config into the image

COPY deployment/config/pg_tileserv.toml /etc/pg_tileserv.toml

EXPOSE 7800

HEALTHCHECK --interval=90s --timeout=10s --retries=3 \
  CMD curl --fail http://localhost:7800/ || exit 1

ENTRYPOINT ["pg_tileserv"]
