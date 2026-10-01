from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import AccessToken, RateBucket

class Command(BaseCommand):
    help = "Delete expired access tokens and rate-limit buckets."
    def handle(self, *args, **options):
        now = timezone.now()
        AccessToken.objects.filter(expires_at__lte=now).delete()
        RateBucket.objects.filter(expires_at__lte=now).delete()
        self.stdout.write("Expired records removed.")
