# Use the official Python image with version 3.11 as the base image
FROM python:3.11-slim-bullseye

# Set the maintainer label
LABEL maintainer="Hugo Retief <hretief@cgiar.org>"


# Install system dependencies
RUN apt-get update && \
    apt-get install -y postgresql-client nano libgdal-dev libcurl4-gnutls-dev librtmp-dev libssl-dev  binutils libproj-dev gdal-bin  curl gcc &&  \
    pip install uwsgi setuptools;pip uninstall -y wheel && \
    curl -sL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh && \
    bash nodesource_setup.sh && \
    apt-get install nodejs -y && \
    rm nodesource_setup.sh

# Copy the django_project folder into the container
ADD django_project /home/web/django_project

# Copy the requirements.txt file into the container
ADD deployment/docker/requirements.txt /REQUIREMENTS.txt

# Install Python dependencies
RUN pip --disable-pip-version-check --no-cache-dir install -r /REQUIREMENTS.txt

WORKDIR /home/web/django_project/minisass_frontend
RUN npm install --legacy-peer-deps && npm run build

WORKDIR /home/web/django_project

ADD deployment/docker/uwsgi.conf /uwsgi.conf
ADD deployment/docker/entrypoint.sh /entrypoint.sh
RUN chmod 0755 /entrypoint.sh

RUN apt-get -y --purge autoremove  \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Open port 8080 as we will be running our uwsgi socket on that
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["uwsgi", "--ini", "/uwsgi.conf"]
