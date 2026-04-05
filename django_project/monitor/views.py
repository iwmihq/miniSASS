import os
import csv
import json
import shutil
import uuid
import subprocess
from io import BytesIO
from rest_framework import generics

import requests
from django.conf import settings
from django.contrib import messages
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.core.serializers import serialize
from django.db import connection
from django.db.models import (
    F,
    Value
)
from django.db.models.functions import Sqrt
from django.http import Http404, HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.utils.encoding import smart_str
from geopandas import GeoDataFrame
from pandas import DataFrame
from rest_framework.views import APIView
from rest_framework.response import Response

from monitor.forms import SiteForm, ObservationForm, CoordsForm, MapForm
from monitor.models import Schools, Sites, Observations, SiteImage, ObservationPestImage, Pest
from monitor.utils import safe_copy, safe_save_field_file, zip_directory


def get_email_content(observation, new_site=False):
    if new_site:
        email_sub_content = 'new observation and site'
    else:
        email_sub_content = 'new observation'
    email_content = f'''
    Dear {observation.user.get_full_name()},
    
    Thank you for your {email_sub_content} submission.
    
    Site Details:
    River name: {observation.site.river_name}
    Site name: {observation.site.site_name}
    Site Description: {observation.site.description}
    Category: {observation.site.river_cat}
    
    Observation Details:
    Date: {observation.obs_date.strftime("%d %b %Y")}
    Collector's name: {observation.user.get_full_name()}
    Comments/notes: {observation.comment}
    
    Your observation still needs to be verified, and you may be contacted in this regard.
    
    Kind regards,
    The miniSASS team.
    '''
    return email_content

def send_email_observation(observation, new_site=False):
    if new_site:
        email_subject = 'New Site and Observation Submitted'
    else:
        email_subject = 'New Observation Submitted'

    email_content = get_email_content(observation, new_site)
    email_sender = settings.DEFAULT_FROM_EMAIL

    send_mail(email_subject, email_content, email_sender, [observation.user.email])


def index(request):
    site_form = SiteForm()
    observation_form = ObservationForm(initial={'site': '1', 'score': '0.0'})
    coords_form = CoordsForm()
    map_form = MapForm({'zoom_level': '6', 'centre_X': '2747350', 'centre_Y': '-3333950', 'edit_site': 'true', 'error': 'false', 'saved_obs': 'false'})

    if request.method == 'POST':
        site_form = SiteForm(request.POST)
        observation_form = ObservationForm(request.POST)
        coords_form = CoordsForm(request.POST)
        map_form = MapForm(request.POST)

        if site_form.is_valid() and observation_form.is_valid() and coords_form.is_valid():
            if request.POST.get('edit_site') == 'false':
                observation = observation_form.save()
                send_email_observation(observation, new_site=False)
            else:
                current_site = site_form.save()
                current_observation = observation_form.save(commit=False)
                current_observation.site = current_site
                current_observation.save()
                send_email_observation(current_observation, new_site=True)

            site_form = SiteForm()
            observation_form = ObservationForm(initial={'site': '1', 'score': '0.0'})
            coords_form = CoordsForm()
            map_form = MapForm({'zoom_level': '6', 'centre_X': '2747350', 'centre_Y': '-3333950', 'edit_site': 'true', 'error': 'false', 'saved_obs': 'true'})

            messages.success(request, 'Observation saved successfully.')
            return redirect('monitor_index')

        else:
            messages.error(request, 'Please correct the errors in the form.')

    return render(request, 'monitor/index.html', {
        'site_form': site_form,
        'observation_form': observation_form,
        'coords_form': coords_form,
        'map_form': map_form
    })


def observations(request):
    observations = Observations.objects.order_by('-time_stamp')[:10]
    return render(request, 'monitor/observations.html', {'observations': observations})


def detail(request, monitor_id):
    observation = get_object_or_404(Observations, pk=monitor_id)
    return render(request, 'monitor/detail.html', {'observation': observation})


def wms_get_feature_info(request, wms_url, wms_params):
    url = 'http://' + wms_url
    response = requests.get(url, params=wms_params)

    if response.status_code == 200:
        return HttpResponse(response.content, content_type='text/xml')
    else:
        return HttpResponse('Error in WMS request', status=500)


def get_sites(request, x, y, d):
    select_query = '''
        SELECT gid, ST_X(the_geom) as x, ST_Y(the_geom) as y, river_name, site_name, description, river_cat, date(time_stamp) AS time_stamp
        FROM sites
    '''
    order_query = ' ORDER BY river_name, site_name, time_stamp ASC'

    if d == '-9':
        where_query = ''
    else:
        query_envelope = str(float(x) - float(d)) + ',' + str(float(y) - float(d)) + ',' + str(float(x) + float(d)) + ',' + str(float(y) + float(d))
        where_query = '''
            WHERE ST_DWithin(ST_Transform(sites.the_geom, 3857), ST_MakeEnvelope(%s, 3857), %s)
        ''' % (query_envelope, d)

    sql_query = select_query + where_query + order_query

    with connection.cursor() as cursor:
        cursor.execute(sql_query)
        sites_returned = cursor.fetchall()

    return render(request, 'monitor/sites.html', {'sites': sites_returned})


def get_closest_site(request, x, y, d):
    xy_point = 'POINT(' + x + ' ' + y + ')'

    sites = Sites.objects.annotate(
        distance=Sqrt(
            F('the_geom').transform(3857, output_field=Value('GEOMETRY')),
            F('the_geom').transform(3857, output_field=Value('GEOMETRY'))
        ).distance(xy_point)
    )

    closest_site = sites.filter(distance__lte=d).order_by('distance').first()

    return render(request, 'monitor/closest_site.html', {'site': closest_site})


def get_unique(request, field):
    values_returned = Sites.objects.values(field).distinct()
    unique_values = [value[field] for value in values_returned]
    return render(request, 'monitor/unique_values.html', {'values': unique_values})

def get_schools(request):
    search_str = request.GET.get('query', '')  # Use get() method to provide a default value
    schools_returned = Schools.objects.filter(school__istartswith=search_str).order_by('school')
    return render(request, 'monitor/schools.html', {'schools': schools_returned})


def get_observations(request, site_id):
    observations = Observations.objects.filter(site=site_id).order_by('obs_date')
    return render(request, 'monitor/site_observations.html', {'observations': observations})


def get_actual_value(val):
    if val is None or int(val) == -9999:
        return ''
    return val


class DownloadObservations(APIView):

    def get(self, request, site_id):
        start_date = request.GET.get('start_date', timezone.now().strftime('%Y-%m-%d'))
        end_date = request.GET.get('end_date', timezone.now().strftime('%Y-%m-%d'))
        observations = Observations.objects.filter(
            site=site_id,
            obs_date__gte=start_date,
            obs_date__lte=end_date
        )
        obs_list = []

        # TODO: Refactor these duplications
        headers = [
            smart_str("Obs ID"),
            smart_str("User name"),
            smart_str("Obs Date"),
            smart_str("Site name"),
            smart_str("River name"),
            smart_str("River category"),
            smart_str("Latitude"),
            smart_str("Longitude"),
            smart_str("Flatworms"),
            smart_str("Worms"),
            smart_str("Leeches"),
            smart_str("Crabs/shrimps"),
            smart_str("Stoneflies"),
            smart_str("Minnow mayflies"),
            smart_str("Other mayflies"),
            smart_str("Damselflies"),
            smart_str("Dragonflies"),
            smart_str("Bugs/beetles"),
            smart_str("Caddisflies"),
            smart_str("True flies"),
            smart_str("Snails"),
            smart_str("Score"),
            smart_str("Status"),
            smart_str("Water clarity"),
            smart_str("Water temp"),
            smart_str("pH"),
            smart_str("Diss oxygen"),
            smart_str("diss oxygen unit"),
            smart_str("Elec cond"),
            smart_str("Elec cond unit"),
            smart_str("Comment"),
        ]
        for obs in observations:
            if obs.flag == 'clean':
                flag = 'Verified'
            else:
                flag = 'Unverified'
            row = [
                smart_str(obs.pk),
                smart_str(obs.user.username),
                smart_str(obs.obs_date),
                smart_str(obs.site.site_name),
                smart_str(obs.site.river_name),
                smart_str(obs.site.river_cat),
                smart_str(obs.site.the_geom.y),
                smart_str(obs.site.the_geom.x),
                smart_str(obs.flatworms),
                smart_str(obs.worms),
                smart_str(obs.leeches),
                smart_str(obs.crabs_shrimps),
                smart_str(obs.stoneflies),
                smart_str(obs.minnow_mayflies),
                smart_str(obs.other_mayflies),
                smart_str(obs.damselflies),
                smart_str(obs.dragonflies),
                smart_str(obs.bugs_beetles),
                smart_str(obs.caddisflies),
                smart_str(obs.true_flies),
                smart_str(obs.snails),
                smart_str(obs.score),
                smart_str(flag),
                smart_str(get_actual_value(obs.water_clarity)),
                smart_str(get_actual_value(obs.water_temp)),
                smart_str(get_actual_value(obs.ph)),
                smart_str(get_actual_value(obs.diss_oxygen)),
                smart_str(obs.diss_oxygen_unit),
                smart_str(get_actual_value(obs.elec_cond)),
                smart_str(obs.elec_cond_unit),
                smart_str(obs.comment),
            ]
            obs_list.append(row)

        file_type = request.GET.get('type', 'csv')
        include_image = request.GET.get('include_image', 'yes')
        include_image = include_image.lower() in ['true', 'yes', '1']

        dir_path = os.path.join(settings.MEDIA_ROOT, 'observation_reports', f'{uuid.uuid4().hex}', 'exports')
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
        shutil.copy(
            os.path.join(os.getcwd(), 'monitor', 'observation_download_files', 'observations.qgz'),
            dir_path
        )
        file_name = f"observations.{file_type}"
        file_path = os.path.join(dir_path, file_name)\

        if file_type == 'csv':
            with open(file_path, 'w') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(headers)
                for obs in obs_list:
                    writer.writerow(obs)
        else:
            site_images = json.loads(
                serialize(
                    "geojson",
                    Sites.objects.filter(gid=site_id),
                    geometry_field="the_geom"
                )
            )
            site_images = {feature['id']: feature for feature in site_images['features']}
            observations_dict = json.loads(serialize("geojson", observations, geometry_field="geom"))
            users = {}
            for obs in observations_dict['features']:
                site = site_images[obs['properties']['site']]
                if obs['properties']['user'] in users:
                    username = users[obs['properties']['user']]
                else:
                    username = User.objects.get(id=obs['properties']['user']).username
                    users[obs['properties']['user']] = username
                prop = {'username': username}
                prop.update(site['properties'])
                prop.update(obs['properties'])
                obs['geometry'] = site['geometry']
                obs['properties'] = prop
                del obs['properties']['time_stamp']

            dataframe = GeoDataFrame.from_features(observations_dict)
            dataframe = dataframe.set_crs(4326)
            dataframe.to_file(file_path, layer='observations', driver="GPKG")

        if include_image:
            images_path = os.path.join(dir_path, 'Images')
            if observations.first():
                site_images = []
                site_image_path = os.path.join(images_path, 'Site')
                if not os.path.exists(site_image_path):
                    os.makedirs(site_image_path)
                for img in SiteImage.objects.filter(site=observations.first().site):
                    try:
                        final_name = safe_save_field_file(img.image, site_image_path)
                    except (FileNotFoundError, Exception):
                        continue
                    site_images.append({
                        'id': img.id,
                        'site': img.site_id,
                        'image': os.sep.join(final_name.split(os.sep)[-3:]),
                    })
                if site_images:
                    dataframe = DataFrame.from_records(site_images)
                    site_images_table = os.path.join(dir_path, 'site_images.csv')
                    dataframe.to_csv(site_images_table, index=False)

            if observations.exists():
                all_obs_image_path = os.path.join(images_path, 'Observations')
                os.makedirs(all_obs_image_path)
                observation_images = []
                for obs in observations:
                    obs_images = ObservationPestImage.objects.filter(observation=obs)
                    obs_image_path = os.path.join(all_obs_image_path, obs.obs_date.strftime('%Y-%m-%d'))
                    if not os.path.exists(obs_image_path):
                        os.mkdir(obs_image_path)
                    for img in obs_images:
                        pest_path = os.path.join(obs_image_path, img.group.name)
                        if not os.path.exists(pest_path):
                            # if the demo_folder directory is not present
                            # then create it.
                            os.makedirs(pest_path)
                        try:
                            final_name = safe_save_field_file(
                                img.image,
                                pest_path,
                                os.path.basename(img.image.name)
                            )
                        except (FileNotFoundError, Exception):
                            continue
                        observation_images.append({
                            'id': img.id,
                            'observation': img.observation_id,
                            'pest': img.pest_id,
                            'image': os.sep.join(final_name.split(os.sep)[-5:]),
                        })
                if observation_images:
                    dataframe = DataFrame.from_records(observation_images)
                    observation_images_table = os.path.join(dir_path, 'observation_images.csv')
                    dataframe.to_csv(observation_images_table, index=False)

            pests = Pest.objects.values()
            dataframe = DataFrame.from_records(pests)
            pest_table = os.path.join(dir_path, 'pests.csv')
            dataframe.to_csv(pest_table, index=False)

            if file_type == 'gpkg':
                with open(os.path.join(dir_path, 'README'), 'w') as f:
                    content = """Table relations

observations:
- id: ID of the observation
- site: ID of the observation site

pests:
- id: ID of the pest

observation_images:
- id: ID of the image
- observation: ID of the observation. You can link this to "id" field in observation table.
- pest: ID of the pest. You can link this to "id" field in pest table.

site_images:
- id: ID of the image
- site: ID of the site. You can link this to "site" field in observation table.

If site_images or observation_images does not exist in the Geopackage, it means the exported data
does not have images."""
                    f.write(content)
                try:
                    subprocess.run(['ogr2ogr', '-append', file_path, observation_images_table])
                    os.remove(observation_images_table)
                except UnboundLocalError:
                    pass
                try:
                    subprocess.run(['ogr2ogr', '-append', file_path, pest_table])
                    os.remove(pest_table)
                except UnboundLocalError:
                    pass
                try:
                    subprocess.run(['ogr2ogr', '-append', file_path, site_images_table])
                    os.remove(site_images_table)
                except UnboundLocalError:
                    pass

            mem_zip = BytesIO()
            zip_directory(dir_path, mem_zip)

            response = HttpResponse(mem_zip.getvalue(), content_type='application/zip')
            response['Content-Disposition'] = f'attachment; filename={file_name}'

            shutil.rmtree(dir_path)

            return response
        else:
            f = open(file_path, 'rb')
            dest_file = BytesIO()
            dest_file.write(f.read())
            f.close()
            dest_file.seek(0)
            content_type = 'text/csv' if file_type == 'csv' else 'application/x-sqlite3'
            response = HttpResponse(dest_file.read(),  content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename={file_name}'
            shutil.rmtree(dir_path)

            return response


def download_observations(request, site_id):
    observations = Observations.objects.filter(site=site_id)

    select_clause = 'SELECT gid, ST_X(the_geom) as x, ST_Y(the_geom) as y FROM sites WHERE gid = ' + str(site_id)
    site_coords = Sites.objects.raw(select_clause)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="observations.csv"'
    writer = csv.writer(response)
    response.write(u'\ufeff'.encode('utf8'))  # BOM (optional...Excel needs it to open UTF-8 file properly)
    writer.writerow([
        smart_str("Obs ID"),
        smart_str("User name"),
        smart_str("Obs Date"),
        smart_str("Site name"),
        smart_str("River name"),
        smart_str("River category"),
        smart_str("Latitude"),
        smart_str("Longitude"),
        smart_str("Flatworms"),
        smart_str("Worms"),
        smart_str("Leeches"),
        smart_str("Crabs/shrimps"),
        smart_str("Stoneflies"),
        smart_str("Minnow mayflies"),
        smart_str("Other mayflies"),
        smart_str("Damselflies"),
        smart_str("Dragonflies"),
        smart_str("Bugs/beetles"),
        smart_str("Caddisflies"),
        smart_str("True flies"),
        smart_str("Snails"),
        smart_str("Score"),
        smart_str("Status"),
        smart_str("Water clarity"),
        smart_str("Water temp"),
        smart_str("pH"),
        smart_str("Diss oxygen"),
        smart_str("diss oxygen unit"),
        smart_str("Elec cond"),
        smart_str("Elec cond unit"),
        smart_str("Comment"),
    ])
    for obs in observations:
        if obs.flag == 'clean':
            flag = 'Verified'
        else:
            flag = 'Unverified'
        writer.writerow([
            smart_str(obs.pk),
            smart_str(obs.user.username),
            smart_str(obs.obs_date),
            smart_str(obs.site.site_name),
            smart_str(obs.site.river_name),
            smart_str(obs.site.river_cat),
            smart_str(site_coords[0].y),
            smart_str(site_coords[0].x),
            smart_str(obs.flatworms),
            smart_str(obs.worms),
            smart_str(obs.leeches),
            smart_str(obs.crabs_shrimps),
            smart_str(obs.stoneflies),
            smart_str(obs.minnow_mayflies),
            smart_str(obs.other_mayflies),
            smart_str(obs.damselflies),
            smart_str(obs.dragonflies),
            smart_str(obs.bugs_beetles),
            smart_str(obs.caddisflies),
            smart_str(obs.true_flies),
            smart_str(obs.snails),
            smart_str(obs.score),
            smart_str(flag),
            smart_str(get_actual_value(obs.water_clarity)),
            smart_str(get_actual_value(obs.water_temp)),
            smart_str(get_actual_value(obs.ph)),
            smart_str(get_actual_value(obs.diss_oxygen)),
            smart_str(obs.diss_oxygen_unit),
            smart_str(get_actual_value(obs.elec_cond)),
            smart_str(obs.elec_cond_unit),
            smart_str(obs.comment),
        ])
    return response


def download_observations_filtered(request, filter_string):
    select_clause = 'SELECT * FROM minisass_observations WHERE ' + filter_string.replace("+", " ")
    with connection.cursor() as cursor:
        cursor.execute(select_clause)

        fieldnames = [name[0] for name in cursor.description]
        observations = [dict(zip(fieldnames, row)) for row in cursor.fetchall()]

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="observations.csv"'
    writer = csv.writer(response)
    response.write(u'\ufeff'.encode('utf8'))  # BOM (optional...Excel needs it to open UTF-8 file properly)
    writer.writerow([
        smart_str("Obs ID"),
        smart_str("User name"),
        smart_str("Obs Date"),
        smart_str("Site name"),
        smart_str("River name"),
        smart_str("River category"),
        smart_str("Latitude"),
        smart_str("Longitude"),
        smart_str("Flatworms"),
        smart_str("Worms"),
        smart_str("Leeches"),
        smart_str("Crabs/shrimps"),
        smart_str("Stoneflies"),
        smart_str("Minnow mayflies"),
        smart_str("Other mayflies"),
        smart_str("Damselflies"),
        smart_str("Dragonflies"),
        smart_str("Bugs/beetles"),
        smart_str("Caddisflies"),
        smart_str("True flies"),
        smart_str("Snails"),
        smart_str("Score"),
        smart_str("Status"),
        smart_str("Water clarity"),
        smart_str("Water temp"),
        smart_str("pH"),
        smart_str("Diss oxygen"),
        smart_str("diss oxygen unit"),
        smart_str("Elec cond"),
        smart_str("Elec cond unit"),
        smart_str("Comment"),
    ])
    for obs in observations:
        if obs['flag'] == 'clean':
            flag = 'Verified'
        else:
            flag = 'Unverified'
        writer.writerow([
            smart_str(obs['observations_gid']),
            smart_str(obs['username']),
            smart_str(obs['obs_date']),
            smart_str(obs['site_name']),
            smart_str(obs['river_name']),
            smart_str(obs['river_cat']),
            smart_str(obs['y']),
            smart_str(obs['x']),
            smart_str(obs['flatworms']),
            smart_str(obs['worms']),
            smart_str(obs['leeches']),
            smart_str(obs['crabs_shrimps']),
            smart_str(obs['stoneflies']),
            smart_str(obs['minnow_mayflies']),
            smart_str(obs['other_mayflies']),
            smart_str(obs['damselflies']),
            smart_str(obs['dragonflies']),
            smart_str(obs['bugs_beetles']),
            smart_str(obs['caddisflies']),
            smart_str(obs['true_flies']),
            smart_str(obs['snails']),
            smart_str(obs['score']),
            smart_str(flag),
            smart_str(obs['water_clarity']),
            smart_str(obs['water_temp']),
            smart_str(obs['ph']),
            smart_str(obs['diss_oxygen']),
            smart_str(obs['diss_oxygen_unit']),
            smart_str(obs['elec_cond']),
            smart_str(obs['elec_cond_unit']),
            smart_str(obs['comment']),
        ])
    return response


def zoom_observation(request, obs_id):
    try:
        observation = Observations.objects.get(pk=obs_id)
        site = Sites.objects.get(pk=observation.site_id)
    except (Observations.DoesNotExist, Sites.DoesNotExist):
        raise Http404("Observation does not exist")

    x = site.the_geom.coords[0]
    y = site.the_geom.coords[1]

    site_form = SiteForm()
    observation_form = ObservationForm(initial={'site': '1', 'score': '0.0'})
    coords_form = CoordsForm()
    map_form = MapForm({
        'zoom_level': '15',
        'centre_X': x,
        'centre_Y': y,
        'edit_site': 'true',
        'error': 'false'
    })

    return render(request, 'monitor/index.html', {
        'site_form': site_form,
        'observation_form': observation_form,
        'coords_form': coords_form,
        'map_form': map_form
    })


class CheckSiteIsLand(APIView):
    def get(self, request, lat, long):
        sql_query = '''
            SELECT point_intersects_admin(%s, %s);
        ''' % (lat, long)

        with connection.cursor() as cursor:
            cursor.execute(sql_query)
            is_land = cursor.fetchall()[0][0]
            return Response({'is_land': is_land})


class ObservationCountView(APIView):
    """Return the total number of observations."""
    def get(self, request):
        count = Observations.objects.count()
        return Response({'count': count})


class SiteCountView(APIView):
    """Return the total number of sites."""
    def get(self, request):
        count = Sites.objects.count()
        return Response({'count': count})
