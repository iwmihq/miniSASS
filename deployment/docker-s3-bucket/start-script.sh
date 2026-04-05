#!/bin/bash

echo $AWS_ACCESS_KEY:$AWS_SECRET_ACCESS_KEY > /root/.passwd-s3fs && \
chmod 600 /root/.passwd-s3fs

mkdir -p ${S3_MOUNT_DIRECTORY}

command="s3fs ${S3_BUCKET_NAME} ${S3_MOUNT_DIRECTORY} -o passwd_file=/root/.passwd-s3fs -o url=${MINIO_URL} -o endpoint=${AWS_REGION} -o dbglevel=info -f -o curldbg -o use_path_request_style -o nonempty"
eval $command




