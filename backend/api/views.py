import hashlib
import json
import logging
import secrets
from datetime import timedelta
from functools import wraps
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator, default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction, IntegrityError
from django.db.models import F
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import User, AccessToken, Snapshot, RateBucket
from .validation import validate_snapshot

log = logging.getLogger(__name__)

class VerificationToken(PasswordResetTokenGenerator):
    key_salt = "neurolift.verify"
    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{user.password}{user.is_active}{timestamp}{user.email}"

verification_token = VerificationToken()

def error(message, status=400):
    return JsonResponse({"error": message}, status=status)

def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()

def rate_limit(request, action, email=""):
    now = timezone.now()
    slot = int(now.timestamp()) // 300
    identities = [(request.META.get("REMOTE_ADDR", ""), 100)]
    if email:
        identities.append((email, 10))
    for identity, maximum in identities:
        key = digest(f"{action}:{identity}:{slot}")
        RateBucket.objects.get_or_create(key=key, defaults={"expires_at": now + timedelta(minutes=10)})
        RateBucket.objects.filter(pk=key).update(count=F("count") + 1)
        if RateBucket.objects.get(pk=key).count > maximum:
            return True
    return False

def endpoint(methods, authenticated=False):
    def decorate(fn):
        @csrf_exempt
        @wraps(fn)
        def view(request, *args, **kwargs):
            # API only accepts explicit bearer tokens, never cookie authentication.
            # JSON-only writes also reject ordinary cross-origin form posts.
            if request.method not in methods:
                return error("Method not allowed.", 405)
            if request.method != "GET" and request.content_type != "application/json":
                return error("Use application/json.", 415)
            if request.method != "GET":
                try:
                    request.payload = json.loads(request.body or b"{}")
                    if not isinstance(request.payload, dict):
                        return error("Expected a JSON object.")
                except (ValueError, UnicodeDecodeError):
                    return error("Invalid JSON.")
            if authenticated:
                authorization = request.headers.get("Authorization", "")
                if not authorization.startswith("Bearer "):
                    return error("Sign in to continue.", 401)
                token = AccessToken.objects.select_related("user").filter(
                    digest=digest(authorization[7:]), expires_at__gt=timezone.now(), user__is_active=True
                ).first()
                if not token:
                    return error("Your session expired. Sign in again.", 401)
                request.api_token = token
                request.api_user = token.user
            try:
                response = fn(request, *args, **kwargs)
            except ValidationError as exc:
                response = error(" ".join(exc.messages))
            response["Cache-Control"] = "no-store"
            return response
        return view
    return decorate

def field(data, key, max_length=254):
    value = data.get(key, "")
    if not isinstance(value, str) or len(value) > max_length:
        raise ValidationError(f"Invalid {key}.")
    return value

def credentials(data):
    email = field(data, "email").strip().lower()
    validate_email(email)
    return email, field(data, "password", 256)

def user_json(user):
    return {"id": str(user.pk), "email": user.email, "emailVerified": user.is_active}

def email_link(user, flow):
    generator = verification_token if flow == "verify" else default_token_generator
    query = urlencode({"flow": flow, "uid": str(user.pk), "token": generator.make_token(user)})
    url = f"{settings.FRONTEND_URL}/#account?{query}"
    send_mail(
        "Verify your NeuroLift email" if flow == "verify" else "Reset your NeuroLift password",
        f"Open this link within one hour:\n{url}\n\nIf you did not request this, ignore this email.",
        settings.DEFAULT_FROM_EMAIL, [user.email],
    )

@endpoint(["GET"])
def health(request):
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    return JsonResponse({"status": "ok"})

@endpoint(["POST"])
def register(request):
    email, password = credentials(request.payload)
    if rate_limit(request, "email", email):
        return error("Too many requests. Try again in five minutes.", 429)
    validate_password(password, User(email=email))
    user = User.objects.filter(email=email).first()
    if user is None:
        try:
            with transaction.atomic():
                user = User.objects.create_user(email=email, password=password)
                Snapshot.objects.create(user=user)
        except IntegrityError:
            user = User.objects.get(email=email)
    if not user.is_active:
        try:
            email_link(user, "verify")
        except Exception:
            log.warning("Verification delivery failed")
            return error("Email delivery is unavailable. Try resending later.", 503)
    return JsonResponse({"message": "If eligible, a verification email has been sent."}, status=202)

@endpoint(["POST"])
def login(request):
    email, password = credentials(request.payload)
    if rate_limit(request, "login", email):
        return error("Too many attempts. Try again in five minutes.", 429)
    user = authenticate(request, email=email, password=password)
    if not user:
        return error("Unable to sign in. Check your credentials and verify your email.", 401)
    value = secrets.token_urlsafe(48)
    expires = timezone.now() + timedelta(hours=12)
    AccessToken.objects.create(digest=digest(value), user=user, expires_at=expires)
    AccessToken.objects.filter(user=user, expires_at__lte=timezone.now()).delete()
    return JsonResponse({"user": user_json(user), "token": value, "expiresAt": expires.isoformat()})

@endpoint(["GET"], authenticated=True)
def me(request):
    return JsonResponse({"user": user_json(request.api_user)})

@endpoint(["POST"], authenticated=True)
def logout(request):
    request.api_token.delete()
    return JsonResponse({"message": "Signed out."})

@endpoint(["POST"])
def request_link(request, flow):
    email = field(request.payload, "email").strip().lower()
    validate_email(email)
    if rate_limit(request, "email", email):
        return error("Too many requests. Try again in five minutes.", 429)
    user = User.objects.filter(email=email, is_active=(flow == "reset")).first()
    if user:
        try:
            email_link(user, flow)
        except Exception:
            log.warning("Account email delivery failed")
            return error("Email delivery is unavailable. Please try later.", 503)
    return JsonResponse({"message": "If eligible, an email has been sent."}, status=202)

@endpoint(["POST"])
def confirm_link(request, flow):
    uid = field(request.payload, "uid", 30)
    token = field(request.payload, "token", 256)
    if rate_limit(request, "confirm"):
        return error("Too many attempts. Try again later.", 429)
    if not uid.isdecimal():
        return error("Invalid or expired link.")
    with transaction.atomic():
        user = User.objects.select_for_update().filter(pk=uid).first()
        generator = verification_token if flow == "verify" else default_token_generator
        if not user or user.is_active != (flow == "reset") or not generator.check_token(user, token):
            return error("Invalid or expired link.")
        if flow == "verify":
            user.is_active = True
            user.save(update_fields=["is_active"])
        else:
            password = field(request.payload, "password", 256)
            validate_password(password, user)
            user.set_password(password)
            user.save(update_fields=["password"])
            AccessToken.objects.filter(user=user).delete()
    return JsonResponse({"message": "Email verified. You can sign in." if flow == "verify" else "Password changed. Sign in again."})

@endpoint(["GET", "PUT"], authenticated=True)
def snapshot(request):
    if request.method == "GET":
        state, _ = Snapshot.objects.get_or_create(user=request.api_user)
        return JsonResponse({"version": state.version, "data": state.data})
    data = request.payload.get("data")
    version = request.payload.get("version")
    if type(version) is not int or version < 0:
        return error("A valid base version is required.")
    validate_snapshot(data)
    # Compare-and-swap in one SQL UPDATE prevents lost updates on SQLite and Postgres.
    updated = Snapshot.objects.filter(user=request.api_user, version=version).update(
        data=data, version=F("version") + 1, updated_at=timezone.now()
    )
    if not updated:
        return error("Data changed on another device. Resolve the conflict before syncing.", 409)
    return JsonResponse({"version": version + 1, "data": data})

@endpoint(["POST"], authenticated=True)
def delete_account(request):
    password = field(request.payload, "password", 256)
    if rate_limit(request, "delete", request.api_user.email):
        return error("Too many attempts.", 429)
    if not request.api_user.check_password(password):
        return error("Incorrect password.", 403)
    with transaction.atomic():
        request.api_user.delete()
    return JsonResponse({"message": "Account and server data deleted."})
