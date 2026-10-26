from django.urls import path
from api import views
from api import record_views

urlpatterns = [
 path("api/records/migrate/", record_views.migrate),
 path("api/records/operation/", record_views.operation),
 path("api/records/changes/", record_views.changes),
 path("api/health/", views.health),
 path("api/auth/register/", views.register),
 path("api/auth/login/", views.login),
 path("api/auth/me/", views.me),
 path("api/auth/logout/", views.logout),
 path("api/auth/verify/request/", views.request_link, {"flow": "verify"}),
 path("api/auth/verify/confirm/", views.confirm_link, {"flow": "verify"}),
 path("api/auth/reset/request/", views.request_link, {"flow": "reset"}),
 path("api/auth/reset/confirm/", views.confirm_link, {"flow": "reset"}),
 path("api/account/delete/", views.delete_account),
 path("api/snapshot/", views.snapshot),
]
