import os
from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


def privacy_path(instance, filename):
    return os.path.join(
        settings.MINIO_BUCKET,
        'privacy_policy',
        instance.version,
        filename
    )

class PrivacyPolicy(models.Model):
    version = models.CharField(max_length=20, unique=True)
    link = models.URLField(null=True, blank=True)  # link to a hosted document or page
    file = models.FileField(upload_to=privacy_path, null=True, blank=True)
    published_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Privacy Policy v{self.version}"

    class Meta:
        verbose_name = "Privacy Policy"
        verbose_name_plural = "Privacy Policies"


class PrivacyPolicyConsent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="consents")
    policy = models.ForeignKey(PrivacyPolicy, on_delete=models.CASCADE, related_name="consents")
    consent_given = models.BooleanField(default=True, null=True)  # false = rejected
    consent_date = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'policy')

    def __str__(self):
        return f"{self.user.username} consented to {self.policy.version} on {self.consent_date}"
