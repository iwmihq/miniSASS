import os
import shutil
import requests

from dirtyfields import DirtyFieldsMixin
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.gis.db import models as geometry_fields
from django.db import models
from django.db.models.signals import pre_save, post_delete, post_save
from django.dispatch import receiver
from django.utils.html import mark_safe

from minisass.models import GroupScores
from minisass.utils import delete_file_field, get_path_string
from monitor.utils import get_country_from_coordinates_kartoza_maps


class Organisations(models.Model):
    id = models.AutoField(primary_key=True)
    ORG_CATS = (
        (u'school', u'School'),
        (u'ngo', u'NGO'),
        (u'conservancy', u'Conservancy'),
        (u'private', u'Private citizen'),
        (u'government', u'Government department')
    )
    org_name = models.CharField(max_length=100, blank=True)
    org_type = models.CharField(max_length=11, choices=ORG_CATS, blank=True)

    class Meta:
        db_table = 'organisations'

    def __str__(self):
        return self.org_name


class Schools(models.Model):
    gid = models.AutoField(primary_key=True, editable=False)
    the_geom = geometry_fields.PointField()
    natemis = models.IntegerField()
    school = models.CharField(max_length=255)
    province = models.CharField(max_length=15)
    phase = models.CharField(max_length=12)
    objects = models.Manager()

    class Meta:
        db_table = 'schools'
        managed = False

    def __str__(self):
        return self.school

class Assessment(models.Model):
    assessment = models.AutoField(primary_key=True)
    assessment_data = models.JSONField(blank=True,null=True)

    def __str__(self):
        return self.assessment

class Sites(models.Model):
    RIVER_CATS = (
        (u'rocky', u'Rocky'),
        (u'sandy', u'Sandy')
    )
    gid = models.AutoField(primary_key=True, editable=False)
    the_geom = geometry_fields.PointField()
    site_name = models.CharField(max_length=50, blank=False)
    river_name = models.CharField(max_length=50, blank=False)
    description = models.CharField(max_length=255, blank=True)
    river_cat = models.CharField(max_length=5, choices=RIVER_CATS, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    time_stamp = models.DateTimeField(auto_now=True)
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE,blank=True,null=True)
    objects = models.Manager()
    country = models.CharField(max_length=3, blank=True, null=False)

    class Meta:
        db_table = 'sites'
        verbose_name_plural = 'Sites'

    def __str__(self):
        return self.site_name

    @property
    def folder(self):
        """Return folder of site"""
        return os.path.join(
            settings.MINIO_ROOT,
            settings.MINIO_BUCKET,
            f'{self.gid}'
        )

    def save(self, set_country=False, *args, **kwargs):
        # when creating a new site, and it has no country, set the country
        if not self.gid and not self.country:
            set_country = True
        elif self.gid:
            # when the_geom is updated, update the country
            try:
                old_site = Sites.objects.get(gid=self.gid)
                if old_site.the_geom != self.the_geom:
                    set_country = True
            except Sites.DoesNotExist:
                set_country = True

        if set_country:
            self.country = get_country_from_coordinates_kartoza_maps(
                latitude=self.the_geom.y,
                longitude=self.the_geom.x
            )

        super().save(*args, **kwargs)


def site_image_path(instance, filename):
    return os.path.join(
        settings.MINIO_BUCKET,
        'sites',
        f'{instance.site_id}',
        filename
    )


class SiteImage(models.Model):
    """Image for a site."""
    site = models.ForeignKey(Sites, on_delete=models.CASCADE)
    image = models.ImageField(
        upload_to=site_image_path, max_length=250, storage=settings.MINION_STORAGE
    )

    def delete_image(self):
        """delete image."""
        delete_file_field(self.image)


class Observations(models.Model, DirtyFieldsMixin):
    FLAG_CATS = (
        (u'dirty', u'Dirty'),
        (u'clean', u'Clean')
    )
    UNIT_DO_CATS = (
        (u'mgl', u'mg/l'),
        (u'%DO', u'%DO'),
        (u'PPM', u'PPM'),
        (u'na', u'Unknown')
    )
    UNIT_EC_CATS = (
        (u'S/m', u'S/m'),
        (u'\u00B5S/cm', u'\u00B5S/cm'),
        (u'mS/m', u'mS/m'),
        (u'na', u'Unknown')
    )
    gid = models.AutoField(primary_key=True, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True
    )
    minisass_ml_score = models.FloatField(blank=True, null=True)
    ml_model_version = models.CharField(max_length=255, blank=True, null=True)
    ml_model_type = models.CharField(max_length=255, blank=True, null=True)
    flatworms = models.BooleanField(default=False)
    worms = models.BooleanField(default=False)
    leeches = models.BooleanField(default=False)
    crabs_shrimps = models.BooleanField(default=False)
    stoneflies = models.BooleanField(default=False)
    minnow_mayflies = models.BooleanField(default=False)
    other_mayflies = models.BooleanField(default=False)
    damselflies = models.BooleanField(default=False)
    dragonflies = models.BooleanField(default=False)
    bugs_beetles = models.BooleanField(default=False)
    caddisflies = models.BooleanField(default=False)
    true_flies = models.BooleanField(default=False)
    snails = models.BooleanField(default=False)
    collector_name = models.CharField(max_length=100, blank=True, null=False)
    score = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    site = models.ForeignKey(
        Sites, on_delete=models.CASCADE, related_name='observation',
        blank=True, null=True
    )
    time_stamp = models.DateTimeField(auto_now=True)
    comment = models.CharField(max_length=255, null=True, blank=True)
    obs_date = models.DateField(blank=True, null=True)
    submission_date = models.DateField(blank=False, null=False, default=timezone.now)
    flag = models.CharField(
        max_length=5, choices=FLAG_CATS, default='dirty', blank=False,
        help_text='Flag whether observation comes from expert or novice'
    )
    is_validated = models.BooleanField(
        default=False,
        help_text='Flag whether observation correctness has been validated'
    )
    water_clarity = models.DecimalField(
        max_digits=8, decimal_places=1, blank=True, null=True
    )
    water_temp = models.DecimalField(
        max_digits=8, decimal_places=1, blank=True, null=True
    )
    ph = models.DecimalField(
        max_digits=8, decimal_places=1, blank=True, null=True
    )
    diss_oxygen = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True
    )
    diss_oxygen_unit = models.CharField(
        max_length=8, choices=UNIT_DO_CATS, default='mgl', blank=True
    )
    elec_cond = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True
    )
    elec_cond_unit = models.CharField(
        max_length=8, choices=UNIT_EC_CATS, default='mS/m', blank=True
    )

    class Meta:
        db_table = 'observations'
        verbose_name_plural = 'Observations'

    def save(self, *args, **kwargs):
        if self.user:
            if self.user.userprofile.is_expert:
                self.is_validated = True
        if self.comment is None:
            self.comment = ''
        if (self.collector_name is None or self.collector_name == '') and self.user:
            self.collector_name = f'{self.user.first_name} {self.user.last_name}'.strip()
        return super(Observations, self).save(*args, **kwargs)

    def recalculate_score(self):
        score = 0
        checked_count = 0
        for group in GroupScores.objects.all():
            if group.db_field != '':
                if getattr(self, group.db_field):
                    score += group.sensitivity_score
                    checked_count += 1
        if checked_count > 0:
            self.score = score / checked_count
            self.save()

    def __str__(self):
        return str(self.obs_date) + ': ' + self.site.site_name if self.site else ''


def observation_pest_image_path(instance, filename):
    return os.path.join(
        settings.MINIO_BUCKET,
        'observations',
        'clean' if instance.valid or instance.observation.flag == 'clean' else 'dirty',
        instance.group.db_field or get_path_string(instance.group.name),
        f'{instance.observation.site_id}',
        f'{instance.observation_id}',
        filename
    )


class Pest(models.Model):
    """Pest model."""
    name = models.CharField(max_length=256, unique=True)

    def __str__(self):
        """Return the name."""
        return self.name


class ObservationPestImage(models.Model):
    """Image for site and observation for a site."""
    observation = models.ForeignKey(Observations, on_delete=models.CASCADE)
    pest = models.ForeignKey(Pest, on_delete=models.CASCADE, null=True, blank=True)
    group = models.ForeignKey(GroupScores, on_delete=models.CASCADE, null=True)
    image = models.ImageField(
        upload_to=observation_pest_image_path, max_length=250, storage=settings.MINION_STORAGE
    )
    valid = models.BooleanField(default=False)
    ml_prediction = models.CharField(max_length=255, null=True, blank=True)
    ml_score = models.FloatField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Check image as valid if uploaded by expert.
        if self.observation.user.userprofile.is_expert:
            self.valid = True
        return super().save(*args, **kwargs)

    def get_minio_key(self):
        """
        Return S3/Minio key without bucket
        """
        destination = os.path.join(*self.image.name.split(os.sep)[1:])
        return destination

    def delete_image(self):
        """Delete image from storage."""
        if not self.valid:
            delete_file_field(self.image)

    def update_image_path(self):
        """Move image to correct path in S3 storage."""
        storage = self.image.storage
        old_name = self.image.name
        filename = os.path.basename(old_name)
        new_name = observation_pest_image_path(self, filename)

        if old_name == new_name:
            return

        try:
            # Copy to new location then delete old
            with storage.open(old_name, 'rb') as old_file:
                storage.save(new_name, old_file)
            storage.delete(old_name)
        except Exception:
            return

        self.image.name = new_name

    def image_preview(self):
        return mark_safe('<img src="%s" width="150" height="150" />' % (self.image.url))


# Helper function to send email content based on observation
def send_confirmation_email(observation):
    email_subject = 'Your Observation has been Verified'

    email_content = f'''
Dear {observation.user.get_full_name()},

We want to inform you that your observation has been verified. Below is the \
detail of your observation.

Site Details:
River name: {observation.site.river_name}
Site name: {observation.site.site_name}
Site Description: {observation.site.description}
Category: {observation.site.river_cat}

Observation Details:
Date: {observation.obs_date.strftime("%d %b %Y")}
Collector's name: {observation.user.get_full_name()}
Comments/notes: {observation.comment}

Kind regards,
The miniSASS team.
    '''

    email_sender = 'info@minisass.org'

    observation.user.email_user(email_subject, email_content, email_sender)


# Signal receiver to send email to the user when an observation is verified
@receiver(pre_save, sender=Observations)
def send_email_to_user(sender, instance, **kwargs):
    if not instance.is_dirty():
        return
    dirty_fields = instance.get_dirty_fields()
    # Check if it is verified (the previous state: flag==dirty and the current
    # state == clean)
    if dirty_fields.get('flag') == 'dirty' and instance.flag == 'clean':
        send_confirmation_email(instance)


@receiver(post_delete, sender=Sites)
def site_delete(sender, instance, **kwargs):
    # Site images are deleted via SiteImage post_delete signal
    pass


@receiver(post_delete, sender=SiteImage)
@receiver(post_delete, sender=ObservationPestImage)
def delete_image(sender, instance, **kwargs):
    instance.delete_image()

@receiver(pre_save, sender=ObservationPestImage)
def check_save_image(sender, instance: ObservationPestImage, **kwargs):
    try:
        old_instance = ObservationPestImage.objects.get(id=instance.id)
    except ObservationPestImage.DoesNotExist:
        return

    if instance.valid is True and old_instance.valid is False:
        if instance.image.name != old_instance.image.name:
            return

        instance.observation.is_validated = True
        instance.observation.save()

        instance.update_image_path()
