FROM ubuntu:18.04

## Some utilities
RUN apt-get update -y && \
    apt-get install -y build-essential libfuse-dev libcurl4-openssl-dev libxml2-dev pkg-config libssl-dev mime-support automake libtool wget tar git unzip
RUN apt-get install lsb-release -y  && apt-get install zip -y && apt-get install vim -y

## Install S3 Fuse
RUN rm -rf /usr/src/s3fs-fuse
# RUN git clone https://github.com/s3fs-fuse/s3fs-fuse/ /usr/src/s3fs-fuse
# Pinning to a specific version as the latest version has some issues with the latest fuse library
RUN git clone https://github.com/s3fs-fuse/s3fs-fuse/ /usr/src/s3fs-fuse && \
    cd /usr/src/s3fs-fuse && \
    git checkout v1.89

WORKDIR /usr/src/s3fs-fuse 
RUN ./autogen.sh && ./configure && make -j 6 && make install


## Set Your AWS Access credentials
ENV \
	AWS_ACCESS_KEY=demo \
	AWS_SECRET_ACCESS_KEY=demopass \
	S3_MOUNT_DIRECTORY=/var/www/s3 \
	S3_BUCKET_NAME=demo \
	AWS_REGION=af-south-1 \
	MINIO_URL=http://minio:9000/

## change workdir to /
WORKDIR /

## Entry Point
ADD ./deployment/docker-s3-bucket/start-script.sh /start-script.sh
RUN chmod 755 /start-script.sh 
ENTRYPOINT ["/start-script.sh"]
