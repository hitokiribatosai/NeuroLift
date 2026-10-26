import json
from unittest.mock import patch
from django.test import TestCase, override_settings
from .models import User, Snapshot, TrainingRecord, SyncReceipt
from .record_sync import apply_operation, migrate

@override_settings(SECURE_SSL_REDIRECT=False)
class RecordSyncTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('records@example.test', 'Record-Test-Pass-742!', is_active=True)
        self.source = {'neuroLift_journal': json.dumps([{'id': 'old', 'date': '2026-10-26'}])}
        Snapshot.objects.create(user=self.user, data=self.source)
        response = self.client.post('/api/auth/login/', data=json.dumps({'email': self.user.email, 'password': 'Record-Test-Pass-742!'}), content_type='application/json')
        self.headers = {'HTTP_AUTHORIZATION': 'Bearer ' + response.json()['token']}

    def post(self, endpoint, payload):
        return self.client.post('/api/records/' + endpoint + '/', data=json.dumps(payload), content_type='application/json', **self.headers)

    def operation(self, identity='new', operation='one', revision=0, deleted=False):
        return {'operationId': operation, 'kind': 'journal', 'id': identity,
                'baseRevision': revision, 'deleted': deleted,
                'value': None if deleted else {'id': identity, 'date': '2026-10-26'}}

    def test_migration_preserves_snapshot_and_blocks_legacy_clients(self):
        self.assertEqual(self.post('migrate', {'version': 8}).status_code, 409)
        self.assertFalse(Snapshot.objects.get(user=self.user).records_enabled)
        self.assertEqual(self.post('migrate', {'version': 0}).status_code, 200)
        self.assertEqual(self.post('migrate', {'version': 0}).status_code, 200)
        self.assertEqual(TrainingRecord.objects.count(), 1)
        self.assertEqual(Snapshot.objects.get(user=self.user).data, self.source)
        self.assertEqual(self.client.get('/api/snapshot/', **self.headers).status_code, 426)
        self.assertEqual(self.client.put('/api/snapshot/', data=json.dumps({'version': 0, 'data': {}}), content_type='application/json', **self.headers).status_code, 426)

    def test_retry_is_idempotent_and_reused_operation_id_rejected(self):
        migrate(self.user, 0)
        payload = self.operation()
        first = self.post('operation', payload)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(self.post('operation', payload).json(), first.json())
        self.assertEqual(Snapshot.objects.get(user=self.user).record_cursor, 2)
        self.assertEqual(SyncReceipt.objects.count(), 1)
        payload['value']['date'] = 'changed'
        self.assertEqual(self.post('operation', payload).status_code, 400)
        self.assertEqual(Snapshot.objects.get(user=self.user).record_cursor, 2)

    def test_conflict_retains_server_value_and_deletion_tombstone(self):
        migrate(self.user, 0)
        self.assertEqual(self.post('operation', self.operation()).status_code, 200)
        self.assertEqual(self.post('operation', self.operation(operation='stale')).status_code, 409)
        self.assertEqual(self.post('operation', self.operation(operation='delete', revision=1, deleted=True)).status_code, 200)
        conflict = self.post('operation', self.operation(operation='late', revision=1))
        self.assertEqual(conflict.status_code, 409)
        self.assertTrue(conflict.json()['current']['deleted'])
        self.assertEqual(Snapshot.objects.get(user=self.user).record_cursor, 3)
        changes = self.client.get('/api/records/changes/?cursor=1', **self.headers).json()
        self.assertEqual(len(changes['records']), 1)
        self.assertTrue(changes['records'][0]['deleted'])
        self.assertEqual(changes['cursor'], 3)

    def test_different_records_do_not_conflict_and_accounts_are_isolated(self):
        migrate(self.user, 0)
        other = User.objects.create_user('other@example.test', 'Record-Test-Pass-742!', is_active=True)
        Snapshot.objects.create(user=other)
        migrate(other, 0)
        apply_operation(other, self.operation('private', 'one'))
        self.assertEqual(self.post('operation', self.operation('a', 'one')).status_code, 200)
        self.assertEqual(self.post('operation', self.operation('b', 'two')).status_code, 200)
        result = self.client.get('/api/records/changes/', **self.headers).json()
        self.assertEqual({row['id'] for row in result['records']}, {'old', 'a', 'b'})
        self.assertEqual(self.client.get('/api/records/changes/').status_code, 401)

    def test_invalid_payload_and_receipt_failure_roll_back_everything(self):
        migrate(self.user, 0)
        payload = self.operation()
        payload['value']['id'] = 'wrong'
        self.assertEqual(self.post('operation', payload).status_code, 400)
        with patch('api.record_sync.SyncReceipt.objects.create', side_effect=RuntimeError('injected')):
            with self.assertRaises(RuntimeError):
                apply_operation(self.user, self.operation())
        self.assertEqual(Snapshot.objects.get(user=self.user).record_cursor, 1)
        self.assertFalse(TrainingRecord.objects.filter(record_id='new').exists())
        self.assertEqual(SyncReceipt.objects.count(), 0)
        malformed = self.operation()
        malformed['kind'] = []
        self.assertEqual(self.post('operation', malformed).status_code, 400)

    def test_migration_abort_preserves_legacy_mode_and_allows_retry(self):
        with patch('api.record_sync.TrainingRecord.objects.create', side_effect=RuntimeError('injected')):
            with self.assertRaises(RuntimeError):
                migrate(self.user, 0)
        state = Snapshot.objects.get(user=self.user)
        self.assertFalse(state.records_enabled)
        self.assertEqual(state.data, self.source)
        self.assertEqual(TrainingRecord.objects.count(), 0)
        self.assertEqual(migrate(self.user, 0)['cursor'], 1)

    def test_record_updates_cannot_bypass_the_total_account_size_limit(self):
        migrate(self.user, 0)
        first = self.operation('a', 'a')
        first['value']['notes'] = 'x' * 800000
        self.assertEqual(self.post('operation', first).status_code, 200)
        second = self.operation('b', 'b')
        second['value']['notes'] = 'x' * 800000
        self.assertEqual(self.post('operation', second).status_code, 400)
        self.assertFalse(TrainingRecord.objects.filter(record_id='b').exists())

    def test_change_feed_paginates_without_skipping_tombstones(self):
        migrate(self.user, 0)
        TrainingRecord.objects.bulk_create([TrainingRecord(user=self.user, kind='journal', record_id=str(i), revision=1,
            sequence=i + 2, deleted=True, value=None) for i in range(205)])
        Snapshot.objects.filter(user=self.user).update(record_cursor=206)
        first = self.client.get('/api/records/changes/', **self.headers).json()
        self.assertEqual(len(first['records']), 200)
        self.assertTrue(first['hasMore'])
        second = self.client.get('/api/records/changes/?cursor=' + str(first['cursor']), **self.headers).json()
        self.assertEqual(len(second['records']), 6)
        self.assertFalse(second['hasMore'])
        self.assertEqual(second['cursor'], 206)
