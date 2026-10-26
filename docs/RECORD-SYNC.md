# Record-sync protocol (server foundation, not client rollout)

The additive Django migration defaults every existing account to snapshot mode.
No current frontend calls the new endpoints. Do not migrate live accounts until
the client outbox, conflict resolution and restore acceptance are implemented.

All endpoints require the existing bearer token. Ownership always comes from that
token, never a user ID supplied in the body.

- `POST /api/records/migrate/` accepts `{ "version": <snapshot version> }`.
  Reconcile local/server snapshots first. A mismatched version returns 409 without
  changing mode. Successful migration retains the original snapshot, splits its
  collections/settings into records and returns protocol 2 with a change cursor.
  Pull from cursor 0 after migration; do not assume local data is acknowledged.
- `POST /api/records/operation/` accepts `operationId`, `kind`, `id`,
  `baseRevision`, `deleted`, and `value`. Kinds: workouts, journal, templates,
  schedule, settings. Schedule IDs are weekdays 0–6 and values are template IDs;
  settings IDs are supported workspace keys and values are serialized strings.
  Collection values retain their record ID. New records use base revision 0.
  Deletions require null value and retain a tombstone with an incremented revision.
- `GET /api/records/changes/?cursor=0` returns up to 200 current record versions,
  including tombstones, ordered by server sequence, plus cursor and hasMore.
  It is a convergent state feed, not a complete event/audit log. Continue while
  hasMore is true, and advance the local cursor only in a durable transaction.

An operation ID belongs to one account and one immutable payload. Retrying it
returns its original acknowledgement without advancing the cursor. Reusing the
ID with a different payload is rejected. Same-record revision mismatch returns
409 with the server version; the client must retain its local version for explicit
resolution. Different records do not share a base revision. The server serializes
account cursor allocation with a transactional SQL update. There are no client
timestamp winners. Receipt insertion, record mutation and cursor update commit
together or roll back together.

Once migrated, both GET and PUT `/snapshot/` return 426, so old clients cannot
overwrite records or pull a stale snapshot as current data. The legacy PUT uses
a conditional SQL update that includes the mode flag, covering a migration race.
Deleting the account cascades records and receipts through foreign keys.

Preview bounds: 1.5 MB operation envelope, 1.5 MB aggregate live record values,
20,000 record identities. Tombstones and receipts are retained: do not prune them
without a client-expiry/retention protocol. Receipt storage growth and measured
PostgreSQL concurrency/load remain operational rollout work; this is not a claim
of production-scale capacity. Multi-record batches are not implemented yet.

Verification: Django SQLite test suite covers migration rollback/retry, old-client
blocking, receipt replay/payload mismatch, account isolation, unrelated records,
revision conflicts, deletion versus stale edit, cursor pagination, account quota
and rollback when receipt storage fails. Hosted PostgreSQL and live-client
acceptance remain separate gates.
