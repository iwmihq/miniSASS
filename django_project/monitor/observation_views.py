# Standard library imports
import json
import multiprocessing
import os
from queue import Queue
from datetime import datetime
from decimal import Decimal

# Third-party dependencies
import tempfile
import numpy as np
import tensorflow as tf
from tensorflow import keras
from PIL import Image
import boto3
import botocore

# Django imports
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import Point
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import Max
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

# Django REST framework imports
from rest_framework import generics, mixins, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rest_framework_simplejwt.authentication import JWTAuthentication

# Project-specific imports (minisass and monitor)
from minisass.models import GroupScores
from minisass_authentication.models import UserProfile
from minisass_authentication.permissions import IsAuthenticatedOrWhitelisted
from monitor.models import (
    Observations, Sites, SiteImage, ObservationPestImage
)
from monitor.serializers import (
    ObservationsSerializer,
    ObservationPestImageSerializer,
    ObservationsAllFieldsSerializer
)



def clear_tensorflow_session():
	tf.keras.backend.clear_session()

classes = [
	'bugs_and_beetles',
	'caddisflies',
	'crabs_and_shrimps',
	'damselflies',
	'dragonflies',
	'flat_worms',
	'leeches',
	'minnow_mayflies',
	'other_mayflies',
	'snails_clams_mussels',
	'stoneflies',
	'true_flies',
	'worms'
]


def get_observations_by_site(request, site_id, format=None):
	try:
		site = Sites.objects.get(gid=site_id)
		observations = Observations.objects.filter(site=site)
		serializer = ObservationsAllFieldsSerializer(observations, many=True)

		return JsonResponse({'status': 'success', 'observations': serializer.data})

	except Sites.DoesNotExist as e:
		return JsonResponse({'status': 'error', 'message': 'Site does not exist'}, status=404)


def retrieve_file_from_s3(file_name):
	"""Download a file from S3 using django-storages backend."""
	storage = settings.MINION_STORAGE
	s3_key = f'{settings.MINIO_BUCKET}/{file_name}'

	# Check local cache first
	local_path = os.path.join(settings.MINIO_ROOT, settings.MINIO_BUCKET, file_name)
	if os.path.exists(local_path):
		return local_path

	try:
		os.makedirs(os.path.dirname(local_path), exist_ok=True)
		# Download via boto3 (more efficient for large files like ML models)
		s3_client = boto3.client(
			's3',
			endpoint_url=settings.MINIO_ENDPOINT if settings.MINIO_ENDPOINT else None,
			aws_access_key_id=settings.MINIO_ACCESS_KEY,
			aws_secret_access_key=settings.MINIO_SECRET_KEY,
			region_name=os.getenv('AWS_S3_REGION_NAME', 'af-south-1'),
		)
		s3_client.download_file(settings.MINIO_AI_BUCKET, file_name, local_path)
		return local_path
	except Exception as e:
		print(f"Error retrieving file from S3: {e}")
		return None


file_name = "ai_image_calculation.h5"
downloaded_file_path = retrieve_file_from_s3(file_name)
if downloaded_file_path:
	try:
		model = keras.models.load_model(downloaded_file_path)
	except OSError:
		model = None
else:
	model = None



def classify_image(image):
	if not model:
		return {'error': 'Cannot load model'}
	try:
		with Image.open(image) as pil_image:
			img = pil_image.resize((224, 224))
			img_array = tf.keras.utils.img_to_array(img)
			img_array = tf.expand_dims(img_array, 0)

			predictions = model.predict(img_array)
			score = tf.nn.softmax(predictions[0])
			predicted_class = classes[np.argmax(score)]
			confidence = 100 * np.max(score)
			return {
				'class': predicted_class,
				'confidence': confidence
			}
	except Exception as e:
		print(f"Error during image classification: {e}")
		return {'error': str(e)}
	finally:
		# Clear TensorFlow session to release resources
		clear_tensorflow_session()


# end of ai score calculation section

def convert_to_int(value, default=0):
	try:
		return int(value)
	except (ValueError, TypeError):
		try:
			return int(value.strip().replace('"', ''))
		except (ValueError, TypeError):
			return default

@csrf_exempt
def upload_pest_image(request):
	""""
	This view function handles the upload of pest images, associating them with an observation and a site.

	- Creates an empty site and observation.
	- Associates uploaded images with the observation.
	- Returns the observation ID, site ID, and image IDs for further processing.

	Note:
	- The function saves user uploads before saving the observation to facilitate AI calculations on the images.
	- The returned image IDs can be used for image deletion if the user decides to change their selection.

	Expected Data:
	- 'datainput' object: Contains additional information about the observation.
	- 'observationID': Specifies the ID for the observation.
	- Uploaded files: Images to be associated with the observation.

	:param request: The HTTP request object.
	:return: JsonResponse with status, observation ID, site ID, and pest image IDs.
	"""
	if request.method == 'POST':
		try:
			with transaction.atomic():

				site_id = request.POST.get('siteId')
				observation_id = request.POST.get('observationId')
				site_id = convert_to_int(site_id)
				observation_id = convert_to_int(observation_id)

				if request.user.is_authenticated:
					# If the user is authenticated, use request.user
					user = request.user
				else:
					# If user_id is provided, get the user
					user_id = int(request.POST.get('user_id', 0))
					try:
						user = User.objects.get(pk=user_id)
					except User.DoesNotExist:
						return JsonResponse({'status': 'error', 'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

				try:
					site = Sites.objects.get(gid=site_id)
				except Sites.DoesNotExist:
					max_site_id = Sites.objects.all().aggregate(Max('gid'))[
						'gid__max']
					new_site_id = max_site_id + 1 if max_site_id is not None else 1

					site_name = request.POST.get('siteName', '')
					river_name = request.POST.get('riverName', '')
					description = request.POST.get('siteDescription', '')
					river_cat = request.POST.get('rivercategory', 'rocky')
					latitude = request.POST.get('latitude', None)
					longitude = request.POST.get('longitude', None)
					if latitude is None or longitude is None:
						return JsonResponse(
							{'status': 'error', 'message': 'Lattitude and/or Longitude cannot be None!'},
							status=status.HTTP_400_BAD_REQUEST
						)
					if site_name == '' or river_name == '':
						return JsonResponse(
							{'status': 'error', 'message': 'Site Name and/or River Name cannot be empty!'},
							status=status.HTTP_400_BAD_REQUEST
						)

					site = Sites(
						gid=new_site_id,
						the_geom=Point(x=float(longitude),
									   y=float(latitude), srid=4326),
						user=user
					)

					site.site_name = site_name
					site.river_name = river_name
					site.description = description
					site.river_cat = river_cat
					site.user = user
					site.save()

				try:
					observation = Observations.objects.get(
						gid=observation_id, site=site)
				except Observations.DoesNotExist:
					max_observation_id = Observations.objects.all().aggregate(Max('gid'))[
						'gid__max']
					new_observation_id = max_observation_id + \
						1 if max_observation_id is not None else 1

					observation = Observations.objects.create(
						gid=new_observation_id,
						site=site,
						user=user,
						comment='',
						obs_date=datetime.now()
					)

				# Save images in the request object
				classification_results = []
				for key, image in request.FILES.items():
					if 'pest_' in key:
						group_id = key.split(':')[1]
						if group_id:
							group = GroupScores.objects.get(id=group_id)
							pest_image = ObservationPestImage.objects.create(
								observation=observation,
								group=group
							)
							try:
								pest_image.image = image
								pest_image.save()

								# Open the image for classification
								result = classify_image(image)
								if 'error' not in result:
										# Save classification results to the ObservationPestImage instance
										pest_image.ml_prediction = result['class']
										pest_image.ml_score = result['confidence']
										pest_image.save()
								classification_results.append(result)
							except (OSError, Image.DecompressionBombError, Image.UnidentifiedImageError) as e:
								# Handle image recognition errors
								classification_results.append(
									{'status': 'error', 'message': f'Error recognizing image: {str(e)}'})

				return JsonResponse(
					{
						'status': 'success',
						'observation_id': observation.gid,
						'site_id': site.gid,
						'pest_image_id': pest_image.id,
						'classification_results': classification_results
					},
					status=status.HTTP_201_CREATED
				)
		except ValidationError as ve:
			return JsonResponse({'status': 'error', 'message': 'Invalid input'}, status=status.HTTP_400_BAD_REQUEST)
		except ValueError as e:
			return JsonResponse(
				{'status': 'error', 'message': str(e)},
				status=status.HTTP_400_BAD_REQUEST
			)
		except Exception as e:
			# Handle other exceptions
			return JsonResponse({'status': 'error', 'message': 'An unexpected error occurred'}, status=status.HTTP_400_BAD_REQUEST)

	return JsonResponse({'status': 'error', 'message': 'Invalid request method'})


@csrf_exempt
@login_required
def delete_pest_image(request, observation_pk, pk, **kwargs):
	if request.method == 'POST':
		try:
			# Check if observation_pk and pk are not empty, if empty, use values from kwargs
			observation_id = observation_pk if observation_pk else kwargs.get(
				'observation_pk')
			image_id = pk if pk else kwargs.get('pk')

			if not observation_id or not image_id:
				return JsonResponse({'status': 'error', 'message': 'Observation_pk and pk must be provided.'}, status=400)

			observation = get_object_or_404(Observations, gid=observation_id)

			image = get_object_or_404(
				ObservationPestImage, id=image_id, observation=observation)

			image.delete()

			return JsonResponse({'status': 'success', 'message': 'Image deleted successfully.'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)


class RecentObservationListView(generics.ListAPIView):
	serializer_class = ObservationsSerializer

	def get_queryset(self, site_id=None, recent=True, by_user=False, user=None):
		all_obs = Observations.objects.all().order_by('-time_stamp')
		if site_id:
			all_obs = all_obs.filter(site_id=site_id)
		if by_user and user.id:
			all_obs = all_obs.filter(user=user)
		return all_obs[:20] if recent else all_obs

	def build_recent_observations(self, queryset):
		serialized_data = self.serializer_class(queryset, many=True).data

		recent_observations = []

		for observation in serialized_data:
			try:
				user_profile = UserProfile.objects.get(
					user=observation['user'])
			except UserProfile.DoesNotExist:
				user_profile = None

			try:
				user_obj = User.objects.get(id=observation['user'])
				first_name = user_obj.first_name
			except User.DoesNotExist:
				first_name = None

			recent_observations.append({
				'observation': observation['gid'],
				'site': observation['site']['site_name'],
				'username': first_name,
				'organisation': user_profile.organisation_name if user_profile else "",
				'time_stamp': observation['time_stamp'],
				'obs_date': observation['obs_date'],
				'score': observation['score'],
			})

		return recent_observations

	def get(self, request, *args, **kwargs):
		site_id = request.GET.get('site_id', None)
		by_user = request.GET.get('by_user', 'False')
		by_user = by_user in ['True', 'true', '1', 'yes']
		recent = request.GET.get('recent', 'True')
		recent = recent in ['True', 'true', '1', 'yes']
		queryset = self.get_queryset(site_id, recent, by_user, request.user)
		recent_observations = self.build_recent_observations(queryset)
		return Response(recent_observations)


class ObservationRetrieveView(APIView):
	def get(self, request, *args, **kwargs):
		observation = get_object_or_404(Observations, pk=kwargs['pk'])
		serializer = ObservationsSerializer(observation)
		return Response(serializer.data)


class ObservationImageViewSet(
		mixins.RetrieveModelMixin,
		mixins.DestroyModelMixin,
		mixins.ListModelMixin,
		GenericViewSet
):
	"""Return images of observation"""
	serializer_class = ObservationPestImageSerializer

	def get_queryset(self):
			"""Return queryset."""
			# Short-circuit during schema generation for Swagger
			if getattr(self, 'swagger_fake_view', False):
				return ObservationPestImage.objects.none()

			observation_pk = self.kwargs.get('observation_pk')
			if observation_pk is None:
				raise ValueError("Missing 'observation_pk' in URL")
	
			observation = get_object_or_404(Observations, pk=observation_pk)
			return observation.observationpestimage_set.all()

	def destroy(self, request, *args, **kwargs):
		# TODO:
		#  Update who can delete an image
		observation = get_object_or_404(
			Observations, pk=self.kwargs['observation_pk']
		)
		if not request.user.is_authenticated or (
			not request.user.is_staff and request.user != observation.user
		):
			raise PermissionDenied()
		return super().destroy(request, *args, **kwargs)


class ObservationListCreateView(generics.ListCreateAPIView):
	queryset = Observations.objects.all()
	serializer_class = ObservationsSerializer
	permission_classes = [IsAuthenticatedOrWhitelisted]
	authentication_classes = [JWTAuthentication]

	def create(self, request, *args, **kwargs):
		if request.method == 'POST':
			try:
				longitude = 0
				latitude = 0

				# Parse JSON data from the request body
				data = json.loads(request.data.get('data', '{}'))

				# Extract datainput from the payload
				datainput = data.get('datainput', {})

				# Extract other fields from the payload
				score = Decimal(str(data.get('score', 0)))
				comment = datainput.get('notes', '')
				water_clarity = Decimal(
					str(datainput.get('waterclaritycm', -9999) or -9999))
				water_temp = Decimal(
					str(datainput.get('watertemperatureOne', -9999) or -9999))
				ph = Decimal(str(datainput.get('ph', -9999) or -9999))
				diss_oxygen = Decimal(
					str(datainput.get('dissolvedoxygenOne', -9999) or -9999))
				diss_oxygen_unit = datainput.get('dissolvedoxygenOneUnit', 'mgl')
				elec_cond = Decimal(
					str(datainput.get('electricalconduOne', -9999) or -9999))
				elec_cond_unit = datainput.get('electricalconduOneUnit', 'mS/m')
				site_name = datainput.get('siteName', '')
				river_name = datainput.get('riverName', '')
				description = datainput.get('siteDescription', '')
				river_cat = datainput.get('rivercategory', 'rocky')
				collector_name = datainput.get('collectorsname', '')
				ml_score = datainput.get('ml_score', 0)
				obs_date = datainput.get('date')

				if request.user.is_authenticated:
					# If the user is authenticated, use request.user
					user = request.user
				else:
					# If user_id is provided, get the user
					user_id = int(request.data.get('user_id', 0))
					try:
						user = User.objects.get(pk=user_id)
					except User.DoesNotExist:
						return JsonResponse({'status': 'error', 'message': 'User not found'},
											status=status.HTTP_404_NOT_FOUND)

				site_id_str = str(request.data.get('siteId', '0'))
				selectedSite = 0
				if site_id_str.lower() == 'undefined':
					selectedSite = int(datainput.get('selectedSite', 0))

				observation_id_str = str(request.data.get('observationId', '0'))

				# Remove leading and trailing whitespaces, and replace double quotes
				site_id_str = site_id_str.strip().replace('"', '')
				observation_id_str = observation_id_str.strip().replace('"', '')

				# Check if the strings are not empty before attempting conversion
				try:
					site_id = int(site_id_str) if site_id_str else selectedSite
				except (ValueError, TypeError):
					site_id = selectedSite

				try:
					observation_id = int(
						observation_id_str) if observation_id_str else 0
				except (ValueError, TypeError):
					observation_id = 0

				try:
					latitude_input = datainput.get('latitude', None)
					longitude_input = datainput.get('longitude', None)
					if latitude_input is None or longitude_input is None:
						return JsonResponse(
							{'status': 'error', 'message': 'Lattitude and/or Longitude cannot be None!'},
							status=status.HTTP_400_BAD_REQUEST
						)
					latitude = float(str(latitude_input))
					longitude = float(str(longitude_input))
				except ValueError:
					return JsonResponse(
						{'status': 'error', 'message': 'Invalid longitude or latitude format'},
						status=status.HTTP_400_BAD_REQUEST
					)

				# Check if the values are within a valid range
				if not (-180 <= longitude <= 180 and -90 <= latitude <= 90):
					return JsonResponse(
						{'status': 'error', 'message': 'Invalid longitude or latitude values'},
						status=status.HTTP_400_BAD_REQUEST
					)

				create_site_or_observation = request.data.get(
					'create_site_or_observation', 'true').lower()

				if create_site_or_observation == 'true':
					try:
						site = Sites.objects.get(gid=site_id)
					except Sites.DoesNotExist:
						max_site_id = Sites.objects.all().aggregate(Max('gid'))[
							'gid__max']
						new_site_id = max_site_id + 1 if max_site_id is not None else 1

						if Sites.objects.filter(site_name=site_name).exists():
							saveToSite = request.data.get('saveToSite', 'false').lower()
							if saveToSite == 'true':
								site = Sites.objects.get(site_name=site_name)
							else:
								return JsonResponse(
									{'status': 'error', 'message': 'Site name already exists'},
									status=status.HTTP_400_BAD_REQUEST
								)
						else:
							site = Sites(
								gid=new_site_id,
								site_name=site_name,
								river_name=river_name,
								description=description,
								river_cat=river_cat,
								the_geom=Point(x=longitude, y=latitude, srid=4326),
								user=user
							)
							site.save()

					for key, image in request.FILES.items():
						if 'image_' in key:
							SiteImage.objects.create(
								site=site, image=image
							)

					max_observation_id = Observations.objects.all().aggregate(Max('gid'))[
						'gid__max']
					new_observation_id = max_observation_id + \
										 1 if max_observation_id is not None else 1
					observation = Observations(
						gid=new_observation_id,
						score=score,
						site=site,
						user=user,
						comment=comment,
						minisass_ml_score=ml_score,
						water_clarity=water_clarity,
						water_temp=water_temp,
						ph=ph,
						diss_oxygen=diss_oxygen,
						diss_oxygen_unit=diss_oxygen_unit,
						elec_cond=elec_cond,
						elec_cond_unit=elec_cond_unit,
						obs_date=obs_date,
						collector_name=collector_name
					)
					for db_fields in GroupScores.DB_FIELDS:
						value = data.get(db_fields[0], False)
						setattr(observation, db_fields[0], value)
					observation.save()
					return JsonResponse(
						{'status': 'success', 'observation_id': observation.gid},
						status=status.HTTP_201_CREATED
					)

				elif create_site_or_observation == 'false':
					try:
						site = Sites.objects.get(gid=site_id)

						for key, image in request.FILES.items():
							if 'image_' in key:
								SiteImage.objects.create(
									site=site, image=image
								)

						max_observation_id = Observations.objects.all().aggregate(Max('gid'))[
							'gid__max']
						new_observation_id = max_observation_id + \
											 1 if max_observation_id is not None else 1
						observation = Observations(
							gid=observation_id if observation_id != 0 else new_observation_id,
							score=score,
							site=site,
							user=user,
							comment=comment,
							minisass_ml_score=ml_score,
							water_clarity=water_clarity,
							water_temp=water_temp,
							ph=ph,
							diss_oxygen=diss_oxygen,
							diss_oxygen_unit=diss_oxygen_unit,
							elec_cond=elec_cond,
							elec_cond_unit=elec_cond_unit,
							obs_date=obs_date,
							collector_name=collector_name
						)
						for db_fields in GroupScores.DB_FIELDS:
							value = data.get(db_fields[0], False)
							setattr(observation, db_fields[0], value)
						observation.save()

						# Handle uploaded pest images
						for key, image in request.FILES.items():
							if key.startswith("pest_"):
								# Do something with each file — like saving to a model
								group_name = key.split(':')[1]
								group = GroupScores.objects.get(db_field=group_name)
								pest_image = ObservationPestImage.objects.create(
									observation=observation,
									group=group
								)
								try:
									pest_image.image = image
									pest_image.save()

									# Open the image for classification
									result = classify_image(image)
									if 'error' not in result:
										# Save classification results to the ObservationPestImage instance
										pest_image.ml_prediction = result['class']
										pest_image.ml_score = result['confidence']
										pest_image.save()
								except (OSError, Image.DecompressionBombError, Image.UnidentifiedImageError):
									pass

						return JsonResponse(
							{'status': 'success', 'observation_id': observation.gid},
							status=201
						)

					except Sites.DoesNotExist:
						return JsonResponse(
							{'status': 'error', 'message': 'cannot find site to save observation to'},
							status=status.HTTP_400_BAD_REQUEST
						)
			except ValueError as e:
				return JsonResponse(
					{'status': 'error', 'message': str(e)},
					status=status.HTTP_400_BAD_REQUEST
				)
			except Exception as e:
				return JsonResponse(
					{'status': 'error', 'message': 'An unexpected error occurred'},
					status=status.HTTP_400_BAD_REQUEST
				)

		return JsonResponse(
			{'status': 'error', 'message': 'Invalid request method'},
			status=status.HTTP_400_BAD_REQUEST
		)


class ObservationRetrieveUpdateDeleteView(
		generics.RetrieveUpdateDestroyAPIView
):
	queryset = Observations.objects.all()
	serializer_class = ObservationsSerializer
	permission_classes = [IsAuthenticated]
