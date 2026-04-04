# Use official Nginx image
FROM nginx:alpine

# Copy config template to /tmp/ (NOT /etc/nginx/templates/ which nginx:alpine
# auto-processes and replaces ALL $ variables including nginx ones)
COPY deployment/nginx/sites-enabled/default.conf /tmp/default.conf.template

# Remove any default configs
RUN rm -f /etc/nginx/conf.d/default.conf

# Expose the container port (matches ECS containerPort)
EXPOSE 8090

# Default env vars (overridden by ECS task definition)
ENV S3_MEDIA_BUCKET=minisass-staging
ENV S3_MEDIA_REGION=af-south-1

# envsubst replaces only S3_MEDIA_BUCKET and S3_MEDIA_REGION, preserving nginx $ variables
# Then start nginx directly (bypass entrypoint template processing)
ENTRYPOINT []
CMD ["/bin/sh", "-c", "envsubst '$S3_MEDIA_BUCKET $S3_MEDIA_REGION' < /tmp/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
