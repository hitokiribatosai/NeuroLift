from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.db.models.functions import Lower

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        user = self.model(email=email.strip().lower(), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        return self.create_user(email, password, is_staff=True, is_superuser=True, is_active=True, **extra)

class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=False)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()

    class Meta:
        constraints = [models.UniqueConstraint(Lower("email"), name="unique_lower_email")]

class AccessToken(models.Model):
    digest = models.CharField(max_length=64, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    expires_at = models.DateTimeField(db_index=True)

class Snapshot(models.Model):
    user = models.OneToOneField(User, primary_key=True, on_delete=models.CASCADE)
    version = models.PositiveIntegerField(default=0)
    data = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)
    records_enabled = models.BooleanField(default=False)
    record_cursor = models.PositiveBigIntegerField(default=0)

class TrainingRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    kind = models.CharField(max_length=16)
    record_id = models.CharField(max_length=128)
    revision = models.PositiveBigIntegerField(default=1)
    sequence = models.PositiveBigIntegerField()
    deleted = models.BooleanField(default=False)
    value = models.JSONField(null=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'kind', 'record_id'], name='training_record_identity')]
        indexes = [models.Index(fields=['user', 'sequence'], name='training_record_cursor')]

class SyncReceipt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    operation_id = models.CharField(max_length=128)
    payload_hash = models.CharField(max_length=64)
    response = models.JSONField()

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'operation_id'], name='sync_operation_identity')]

class RateBucket(models.Model):
    key = models.CharField(max_length=64, primary_key=True)
    count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(db_index=True)
