import os.path

from django.core.management.base import BaseCommand
from monitor.models import Observations, ObservationPestImage, SiteImage, site_image_path


class Command(BaseCommand):
    help = 'Move images location and update path to be grouped by flag and group'

    def handle(self, *args, **kwargs):
        for observation in Observations.objects.all():
            if observation.user.userprofile.is_expert:
                observation.is_validated = True
                observation.save()

        observation_images = ObservationPestImage.objects.all()
        observation_images_count = observation_images.count()
        for idx, image in enumerate(observation_images):
            message = f"Processing ObservationPestImage({image.id}) ({idx+1}/{observation_images_count})"
            print(message)
            if image.observation.user.userprofile.is_expert:
                image.valid = True
            image.update_image_path()
            image.save()

        site_images = SiteImage.objects.all()
        site_images_count = site_images.count()
        for idx, image in enumerate(site_images):
            message = f"Processing SiteImage({image.id}) ({idx+1}/{site_images_count})"
            print(message)
            old_name = image.image.name
            filename = os.path.basename(old_name)
            new_name = site_image_path(image, filename)

            if old_name == new_name:
                continue

            storage = image.image.storage
            try:
                with storage.open(old_name, 'rb') as old_file:
                    storage.save(new_name, old_file)
                storage.delete(old_name)
            except Exception:
                continue

            image.image.name = new_name
            image.save()
