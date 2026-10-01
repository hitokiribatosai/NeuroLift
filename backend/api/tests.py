import json
from datetime import timedelta
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.core import mail
from django.utils import timezone
from .models import User, Snapshot, AccessToken
from .views import verification_token, default_token_generator

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", SECURE_SSL_REDIRECT=False)
class AccountTests(TestCase):
    password = "Good-Test-Passphrase-742!"
    def post(self, path, data, token=""):
        return self.client.post("/api/" + path, data=json.dumps(data), content_type="application/json", HTTP_AUTHORIZATION="Bearer " + token if token else "")
    def account(self, email="member@example.test"):
        user = User.objects.create_user(email, self.password, is_active=True)
        Snapshot.objects.create(user=user)
        response = self.post("auth/login/", {"email": email, "password": self.password})
        self.assertEqual(response.status_code, 200)
        return user, response.json()["token"]

    def test_registration_verification_login_and_replay(self):
        self.assertEqual(self.post("auth/register/", {"email":"Member@EXAMPLE.test","password":self.password}).status_code, 202)
        user = User.objects.get(email="member@example.test")
        self.assertNotEqual(user.password, self.password)
        self.assertTrue(user.check_password(self.password))
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("/#account?flow=verify", mail.outbox[0].body)
        self.assertEqual(self.post("auth/login/", {"email":user.email,"password":self.password}).status_code, 401)
        token = verification_token.make_token(user)
        body = {"uid":str(user.pk),"token":token}
        self.assertEqual(self.post("auth/verify/confirm/", body).status_code, 200)
        self.assertEqual(self.post("auth/verify/confirm/", body).status_code, 400)
        self.assertEqual(self.post("auth/login/", {"email":user.email.upper(),"password":self.password}).status_code, 200)

    def test_reset_is_one_time_and_revokes_sessions(self):
        user, token = self.account()
        self.assertEqual(self.post("auth/reset/request/", {"email":user.email}).status_code, 202)
        body = {"uid":str(user.pk),"token":default_token_generator.make_token(user),"password":"Another-Strong-Phrase-937!"}
        self.assertEqual(self.post("auth/reset/confirm/", body).status_code, 200)
        self.assertEqual(self.post("auth/reset/confirm/", body).status_code, 400)
        self.assertEqual(self.client.get("/api/auth/me/", HTTP_AUTHORIZATION="Bearer " + token).status_code, 401)

    def test_snapshot_isolation_conflict_and_invalid_payload(self):
        user, token = self.account()
        other, other_token = self.account("other@example.test")
        data = {"neuroLift_templates":json.dumps([{"id":"t1","name":"Routine","exercises":[]}])}
        url = "/api/snapshot/"
        headers = {"content_type":"application/json","HTTP_AUTHORIZATION":"Bearer " + token}
        response = self.client.put(url, data=json.dumps({"version":0,"data":data}), **headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.put(url, data=json.dumps({"version":0,"data":{}}), **headers).status_code, 409)
        self.assertEqual(self.client.get(url, HTTP_AUTHORIZATION="Bearer " + other_token).json()["data"], {})
        self.assertEqual(self.client.put(url, data=json.dumps({"version":1,"data":{"evil":"yes"}}), **headers).status_code, 400)
        self.assertEqual(self.client.put(url, data=json.dumps({"version":1,"data":{"neuroLift_history":"[1]"}}), **headers).status_code, 400)
        self.assertEqual(self.client.get(url).status_code, 401)
        self.assertEqual(Snapshot.objects.get(user=user).version, 1)

    def test_expired_session_logout_and_deletion(self):
        user, token = self.account()
        self.assertEqual(self.post("account/delete/", {"password":"wrong"}, token).status_code, 403)
        self.assertEqual(self.post("auth/logout/", {}, token).status_code, 200)
        self.assertEqual(self.client.get("/api/snapshot/", HTTP_AUTHORIZATION="Bearer " + token).status_code, 401)
        token = self.post("auth/login/", {"email":user.email,"password":self.password}).json()["token"]
        AccessToken.objects.update(expires_at=timezone.now()-timedelta(seconds=1))
        self.assertEqual(self.client.get("/api/snapshot/", HTTP_AUTHORIZATION="Bearer " + token).status_code, 401)
        token = self.post("auth/login/", {"email":user.email,"password":self.password}).json()["token"]
        self.assertEqual(self.post("account/delete/", {"password":self.password}, token).status_code, 200)
        self.assertFalse(User.objects.filter(pk=user.pk).exists())
        self.assertEqual(Snapshot.objects.count(), 0)
        self.assertEqual(AccessToken.objects.count(), 0)

    def test_invalid_input_and_password_rejection(self):
        for body in [{"email":"bad","password":self.password},{"email":"a@example.test","password":"123"},{"email":[],"password":self.password}]:
            self.assertEqual(self.post("auth/register/", body).status_code, 400)
        self.assertEqual(self.client.post("/api/auth/login/", data={"email":"a"}).status_code, 415)
        self.assertEqual(self.client.post("/api/auth/login/", data="[]", content_type="application/json").status_code, 400)
        self.assertEqual(self.post("auth/verify/confirm/", {"uid":"garbage","token":"wrong"}).status_code, 400)

    def test_throttling_and_reset_enumeration(self):
        for _ in range(10):
            self.assertEqual(self.post("auth/reset/request/", {"email":"missing@example.test"}).status_code, 202)
        self.assertEqual(self.post("auth/reset/request/", {"email":"missing@example.test"}).status_code, 429)

    def test_failed_delivery_can_be_retried(self):
        with patch("api.views.send_mail", side_effect=OSError("SMTP down")):
            self.assertEqual(self.post("auth/register/", {"email":"retry@example.test","password":self.password}).status_code, 503)
        self.assertEqual(self.post("auth/verify/request/", {"email":"retry@example.test"}).status_code, 202)
        self.assertEqual(len(mail.outbox), 1)

    def test_reset_token_cannot_verify_email(self):
        user = User.objects.create_user("inactive@example.test", self.password)
        self.assertEqual(self.post("auth/verify/confirm/", {"uid":str(user.pk),"token":default_token_generator.make_token(user)}).status_code, 400)
