# Use official Nginx image
FROM nginx:alpine

# Set working directory
WORKDIR /etc/nginx

# Copy config as template to a non-magic directory
# (nginx:alpine auto-processes /etc/nginx/templates/ and replaces ALL $ vars)
COPY deployment/nginx/sites-enabled/default.conf /tmp/default.conf.template

# Expose the container port (matches ECS containerPort)
EXPOSE 8090

# Default env vars (overridden by ECS task definition)
ENV S3_MEDIA_BUCKET=minisass-staging
ENV S3_MEDIA_REGION=af-south-1

# envsubst replaces only S3_MEDIA_BUCKET and S3_MEDIA_REGION, preserving nginx variables
CMD ["/bin/sh", "-c", "envsubst '$S3_MEDIA_BUCKET $S3_MEDIA_REGION' < /tmp/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
