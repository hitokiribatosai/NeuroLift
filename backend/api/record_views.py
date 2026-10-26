from django.http import JsonResponse
from .views import endpoint, error
from . import record_sync

@endpoint(['POST'], authenticated=True)
def migrate(request):
    try:
        return JsonResponse(record_sync.migrate(request.api_user, request.payload.get('version')))
    except record_sync.RecordConflict:
        return error('Snapshot changed before migration. Pull and reconcile first.', 409)

@endpoint(['POST'], authenticated=True)
def operation(request):
    try:
        return JsonResponse(record_sync.apply_operation(request.api_user, request.payload))
    except record_sync.RecordConflict as conflict:
        return JsonResponse({'error': 'Record changed on another device.', 'current': conflict.current}, status=409)

@endpoint(['GET'], authenticated=True)
def changes(request):
    try:
        cursor = int(request.GET.get('cursor', '0'))
    except ValueError:
        return error('Invalid cursor.')
    return JsonResponse(record_sync.changes(request.api_user, cursor))
