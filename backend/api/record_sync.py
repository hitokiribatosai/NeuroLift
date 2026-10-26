"""Additive record protocol. Nothing migrates until an authenticated client opts in."""
import hashlib
import json
import re
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from .models import Snapshot, TrainingRecord, SyncReceipt
from .validation import KEYS, validate_snapshot

COLLECTIONS = {'workouts': 'neuroLift_history', 'journal': 'neuroLift_journal', 'templates': 'neuroLift_templates'}

class RecordConflict(Exception):
    def __init__(self, current=None):
        self.current = current

def serialize(record):
    return {'kind': record.kind, 'id': record.record_id, 'revision': record.revision,
            'sequence': record.sequence, 'deleted': record.deleted, 'value': record.value}

def identity(value):
    return isinstance(value, str) and 0 < len(value) <= 128

def validate_record(kind, record_id, value):
    if not identity(record_id):
        raise ValidationError('Invalid record identity.')
    if kind in COLLECTIONS:
        if not isinstance(value, dict) or value.get('id') != record_id:
            raise ValidationError('Record identity does not match its value.')
        validate_snapshot({COLLECTIONS[kind]: json.dumps([value], allow_nan=False)})
    elif kind == 'schedule':
        validate_snapshot({'neuroLift_weekly_schedule': json.dumps({record_id: value})})
    elif kind == 'settings' and record_id in KEYS - set(COLLECTIONS.values()) - {'neuroLift_weekly_schedule'}:
        validate_snapshot({record_id: value})
    else:
        raise ValidationError('Unsupported record kind.')

def split_snapshot(data):
    for kind, key in COLLECTIONS.items():
        for value in json.loads(data.get(key, '[]')):
            yield kind, value['id'], value
    for day, template in json.loads(data.get('neuroLift_weekly_schedule', '{}')).items():
        yield 'schedule', day, template
    for key, value in data.items():
        if key not in set(COLLECTIONS.values()) | {'neuroLift_weekly_schedule'}:
            yield 'settings', key, value

@transaction.atomic
def migrate(user, version):
    if type(version) is not int or not 0 <= version <= 9007199254740991:
        raise ValidationError('A snapshot base version is required.')
    # Acquire the account write lock with a conditional UPDATE on both supported DBs.
    changed = Snapshot.objects.filter(user=user, version=version, records_enabled=False).update(records_enabled=True)
    state = Snapshot.objects.get(user=user)
    if not changed:
        if state.records_enabled:
            return {'protocol': 2, 'cursor': state.record_cursor}
        raise RecordConflict()
    validate_snapshot(state.data)
    sequence = 0
    for kind, record_id, value in split_snapshot(state.data):
        validate_record(kind, record_id, value)
        sequence += 1
        TrainingRecord.objects.create(user=user, kind=kind, record_id=record_id, value=value, sequence=sequence)
    state.record_cursor = sequence
    state.save(update_fields=['record_cursor'])
    return {'protocol': 2, 'cursor': sequence}

@transaction.atomic
def apply_operation(user, payload):
    operation_id = payload.get('operationId')
    kind, record_id = payload.get('kind'), payload.get('id')
    revision, deleted = payload.get('baseRevision'), payload.get('deleted')
    if not identity(operation_id) or not identity(record_id) or type(revision) is not int or revision < 0 or type(deleted) is not bool:
        raise ValidationError('Invalid operation envelope.')
    if not isinstance(kind, str) or kind not in {*COLLECTIONS, 'schedule', 'settings'}:
        raise ValidationError('Invalid record kind.')
    if kind == 'schedule' and not re.fullmatch('[0-6]', record_id):
        raise ValidationError('Invalid schedule identity.')
    if kind == 'settings' and record_id not in KEYS - set(COLLECTIONS.values()) - {'neuroLift_weekly_schedule'}:
        raise ValidationError('Invalid setting identity.')
    if deleted and payload.get('value') is not None:
        raise ValidationError('A deletion must not contain a value.')
    try:
        encoded = json.dumps(payload, sort_keys=True, separators=(',', ':'), allow_nan=False)
    except (TypeError, ValueError):
        raise ValidationError('Invalid operation data.')
    if len(encoded) > 1_500_000:
        raise ValidationError('Operation exceeds preview limit.')
    if not deleted:
        validate_record(kind, record_id, payload.get('value'))
    payload_hash = hashlib.sha256(encoded.encode()).hexdigest()
    if not Snapshot.objects.filter(user=user, records_enabled=True).update(record_cursor=F('record_cursor') + 1):
        raise ValidationError('Migrate this account before record synchronization.')
    state = Snapshot.objects.get(user=user)
    receipt = SyncReceipt.objects.filter(user=user, operation_id=operation_id).first()
    if receipt:
        if receipt.payload_hash != payload_hash:
            raise ValidationError('Operation ID was reused with different data.')
        # A replay must not advance the public cursor.
        Snapshot.objects.filter(user=user).update(record_cursor=F('record_cursor') - 1)
        return receipt.response
    current = TrainingRecord.objects.filter(user=user, kind=kind, record_id=record_id).first()
    if (current.revision if current else 0) != revision:
        raise RecordConflict(serialize(current) if current else None)
    if not current and TrainingRecord.objects.filter(user=user).count() >= 20000:
        raise ValidationError('Account record limit reached. Export a backup.')
    # Keep the existing preview account-size boundary; individual record limits
    # alone would let many large records bypass the old snapshot quota.
    total_bytes = sum(len(json.dumps(value)) for value in TrainingRecord.objects.filter(
        user=user, deleted=False).values_list('value', flat=True))
    if current and not current.deleted:
        total_bytes -= len(json.dumps(current.value))
    if not deleted:
        total_bytes += len(json.dumps(payload['value']))
    if total_bytes > 1_500_000:
        raise ValidationError('Account data exceeds the preview limit. Export a backup.')
    record, _ = TrainingRecord.objects.update_or_create(user=user, kind=kind, record_id=record_id,
        defaults={'revision': revision + 1, 'sequence': state.record_cursor, 'deleted': deleted,
                  'value': None if deleted else payload['value']})
    response = {'record': serialize(record), 'cursor': state.record_cursor}
    SyncReceipt.objects.create(user=user, operation_id=operation_id, payload_hash=payload_hash, response=response)
    return response

def changes(user, cursor):
    state = Snapshot.objects.get(user=user)
    if not state.records_enabled:
        raise ValidationError('Migrate this account before record synchronization.')
    if cursor < 0 or cursor > state.record_cursor:
        raise ValidationError('Invalid change cursor.')
    records = list(TrainingRecord.objects.filter(user=user, sequence__gt=cursor,
                   sequence__lte=state.record_cursor).order_by('sequence')[:200])
    next_cursor = records[-1].sequence if len(records) == 200 else state.record_cursor
    return {'records': [serialize(record) for record in records], 'cursor': next_cursor,
            'hasMore': next_cursor < state.record_cursor}
