#!/bin/bash

# Exit script in case of error
set -e

echo $"\n\n\n"
echo "-----------------------------------------------------"
echo "STARTING DJANGO ENTRYPOINT $(date)"
echo "-----------------------------------------------------"

# Run initialization

if [ -z "${DEV_SETUP}" ]; then
	DEV_SETUP=FALSE
fi

if [[ "${DEV_SETUP}" =~ [Tt][Rr][Uu][Ee] ]]; then
  pushd /home/web/django_project/minisass_frontend || exit
  npm install --legacy-peer-deps && npm run build
fi

echo "Dropping view in the DB"

export PGPASSWORD="${POSTGRES_PASS}"

psql -d "${DJANGO_DB}" -p 5432 -U "${POSTGRES_USER}" -h "${DATABASE_HOST}" -c 'DROP VIEW IF EXISTS public.minisass_observations;'

RESULT=$(psql "${DJANGO_DB}" -U "${POSTGRES_USER}" -p 5432 -h "${DATABASE_HOST}" -c "SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_countries')")
if [ "${RESULT}" != "t" ]; then
  psql -d "${DJANGO_DB}" -p 5432 -U "${POSTGRES_USER}" -h "${DATABASE_HOST}" -f /home/web/django_project/webmapping/sql/admin_countries.sql
  psql -d "${DJANGO_DB}" -p 5432 -U "${POSTGRES_USER}" -h "${DATABASE_HOST}" -f /home/web/django_project/webmapping/sql/intersect.sql

fi


pushd /home/web/django_project || exit
echo 'Initialize project.'
python manage.py collectstatic --noinput #--clear
python manage.py migrate


echo 'Creating superuser...'

if [ -z "${DJANGO_SUPERUSER_USERNAME}" ]; then
    DJANGO_SUPERUSER_USERNAME=kartoza_admin
fi
if [ -z "${DJANGO_SUPERUSER_PASSWORD}" ]; then
    DJANGO_SUPERUSER_PASSWORD="Gs10w29k8*&"
fi
if [ -z "${DJANGO_SUPERUSER_EMAIL}" ]; then
    DJANGO_SUPERUSER_EMAIL=tinashe@kartoza.com
fi
# create super user if one doesn't exist
python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_superuser('${DJANGO_SUPERUSER_USERNAME}', '${DJANGO_SUPERUSER_EMAIL}', '${DJANGO_SUPERUSER_PASSWORD}')" 2>/dev/null || echo 'Superuser already exists, skipping.'

psql -d "${DJANGO_DB}" -p 5432 -U "${POSTGRES_USER}" -h "${DATABASE_HOST}" -f /home/web/django_project/webmapping/sql/observation.sql


echo "Loading fixtures"
python manage.py load_fixtures

echo "-----------------------------------------------------"
echo "FINISHED DJANGO ENTRYPOINT --------------------------"
echo "-----------------------------------------------------"

# Run the CMD
exec "$@"
