# Record-sync protocol (staged client, not automatic rollout)

The additive Django migration defaults every existing account to snapshot mode.
The frontend can synchronize an explicitly attached record-mode database, but
production still initializes legacy storage. No automatic account migration is
enabled. Fresh, empty devices can now join in the staged database path. Do not
migrate live accounts until existing-cache recovery, user-facing opt-in and full
canonical-storage acceptance gates pass.

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

## Staged client

`recordSyncState.ts` owns immutable operation IDs, baseline revisions, pending
desired versions, tombstones and explicit per-record resolution. The training
database commits outbox updates with local edits and commits pull cursors with
materialized records. A receipt never skips the pull cursor past unrelated server
changes. Later local edits remain queued behind an in-flight immutable operation.
Conflict decisions retain both versions in metadata, included in recovery export.

`recordSync.ts` performs bounded pull/upload passes. The existing account sync
dispatcher uses it only when persisted record mode is present; it does not fall
back to snapshots. Online/foreground events and visible pending-work retries
resume synchronization. The account screen has EN/FR/AR record comparison and
resolution controls. Guest data cannot attach to cloud sync. Account ownership is
checked around every network response and serialized local command.

The direct attachment API deliberately requires the complete server record set to
match validated local data and an unchanged local generation. The separate staged
enrollment coordinator now checkpoints a clean snapshot before POST migrate, saves
each downloaded page and cursor, and resumes idempotently after interruption.
Finalization performs a three-way merge against the saved snapshot, retaining
later local edits and explicit conflicts. A failed final transaction leaves the
checkpoint intact. Snapshot-version rejection can clear only an untouched pull;
ordinary network/authentication failures never clear it. Tests use synthetic
accounts only. No live account was migrated. Native builds keep legacy mode.

The browser tests cover durable queue reload, immutable retry, post-send edits,
both conflict choices, unrelated-record merges, tombstones, transaction rollback,
lost-upload transport replay and a phone-sized conflict comparison. They do not
replace live two-device testing, PostgreSQL concurrency measurements or hosted
backup restoration. Authentication expiry and switching during upload now have
browser acceptance tests. Full canonical-storage/restore acceptance still gates
any default activation.

## Fresh-device joining

In the initialized database path, GET `/snapshot/` returning 426 starts a durable
`join` enrollment only for a clean, version-zero account with no cloud records.
It never calls POST migrate or writes snapshots. The checkpoint/page mechanism
downloads records from cursor zero and resumes after reload. Finalization retains
device-local draft state and treats edits made during download as local changes;
overlapping server values become explicit conflicts, not silent replacements.
Guest data remains in its own workspace.

A dirty account, nonzero snapshot version or existing cloud records block this
automatic path without modifying data. Those devices need explicit exported
recovery/reconciliation; that workflow remains a rollout gate. A production
legacy-storage client still reports the upgrade rejection rather than attempting
an unsafe storage switch. Older enrollment checkpoints with no `mode` retain the
original snapshot-upgrade behavior.
