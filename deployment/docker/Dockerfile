# Use the official Python image with version 3.11 as the base image
FROM python:3.11-slim-bullseye

# Set the maintainer label
LABEL maintainer="Hugo Retief <hretief@cgiar.org>"


# Install system dependencies
# Pin apt to Debian's snapshot archive.
#
# Debian 11 (bullseye) is end of life and its debian-security pool has been
# emptied while the index still advertises the packages: apt-get update succeeds,
# then every install 404s on files that no longer exist at any version. That
# breaks this image on any machine, which means it breaks CI and production
# deploys, not just local builds.
#
# snapshot.debian.org serves the archive frozen at a point in time. These are the
# very URLs the python:3.11-slim-bullseye image ships commented out in its own
# sources.list for exactly this situation, so the package set is unchanged: still
# GDAL 3.2.2, which is what fiona needs here.
#
# Check-Valid-Until is disabled because a frozen Release file is by definition
# past its expiry.
#
# The real fix is moving to a supported base image (bookworm), but that changes
# the GDAL and PROJ versions underneath fiona and geopandas, so it needs its own
# change and its own testing rather than being smuggled into a hotfix.
RUN printf '%s\n' \
        'deb http://snapshot.debian.org/archive/debian/20250721T000000Z bullseye main' \
        'deb http://snapshot.debian.org/archive/debian-security/20250721T000000Z bullseye-security main' \
        'deb http://snapshot.debian.org/archive/debian/20250721T000000Z bullseye-updates main' \
        > /etc/apt/sources.list && \
    echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99no-check-valid-until

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
