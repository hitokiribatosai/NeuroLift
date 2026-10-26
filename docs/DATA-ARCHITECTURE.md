# Training data architecture and migration plan

Approved by the owner on 2026-10-25. This is a staged migration, not a claim that
the target architecture is already deployed. Preserve the shared web/Capacitor UI.

## Invariants

- A session has a stable ID before completion. Retrying completion uses that ID;
  it cannot append a second workout or overwrite an already completed workout.
- Lifecycle: draft -> active <-> paused -> completed OR discarded. The existing
  setup/selection/active/summary values are presentation states, not a second
  lifecycle authority. Navigating back to selection must not create a new session.
- Finish validates effort, commits history and draft/clock cleanup together, and
  only then shows success. A failed write preserves the previous durable state.
- Discard removes the draft/clock, not history, templates or preferences.
- Account ownership is captured before asynchronous work and checked before
  commit. Guest data must never become another user's data implicitly.
- Existing record/set/template IDs are retained. Legacy exercises without an
  entry ID receive one only in the explicit versioned migration; never use a
  translated exercise title as a cross-device record identity.
- Training mutations eventually pass through one transactional repository; UI,
  gestures and native notification code do not own persistence rules.
- Workout/rest timers are timestamp based. Device-local session state and native
  notification permissions do not participate in cloud merges.

## Delivery gates

1. Contract and fixtures: inventory existing formats, retain exported legacy
   fixtures and specify lifecycle/failure tests. No data migration yet.
2. Completion safety on current storage: stable ID, guarded finish, atomic
   history + cleanup + dirty marker, strict unreadable-history rejection.
3. Structured local database: versioned IndexedDB repository, account isolation,
   transactions for records and outbox, migration validation and rollback copy.
   Keep small preferences in localStorage. Convert all training readers/writers
   before switching canonical storage; no asynchronous write-behind mirror that
   reports success before durable commit. Native SQLite is a later adapter only
   if real-device evidence requires it.
4. Record sync: Django records, revisions, owner checks, idempotent operations,
   tombstones and ordered change cursor; persistent client outbox and retry.
   Unrelated records merge independently. Concurrent same-record edits require
   explicit resolution with both versions retained. Client timestamps do not
   decide conflict winners. Scope queued operations to their original account.
5. Recovery/operations: versioned export/import, tested restore, health/error
   reporting without private workout content, realistic measured load tests.
6. Cross-platform acceptance and rebuilt Android/iOS test artifacts. Browser
   platform emulation is not physical-device acceptance.

## Compatibility and rollout

Current production-compatible storage is a versioned localStorage workspace and
the `/snapshot/` API. Keep it authoritative until the local database gate passes.
Do not add a nominal outbox while snapshots are still the only sync protocol.
Deploy additive server schema/API support before enabling record sync in clients.
Older clients must either be safely bridged or explicitly prevented from writing
once an account is migrated; never allow legacy snapshots to overwrite newer
records silently. Maintain a documented upgrade path and preserved export.

Each stage gets tests, handover update, commit, unique checkpoint tag and verified
push. Source rollback is not database rollback. Production migrations, restoration
of hosted data, paid service changes and destructive operations require their own
review. No scalability or hosted-backup claims without actual evidence.

## Required failure matrix

Test finish retry/double tap, quota failure, corrupt history, interruption before
and after commit, account switch during save, reload of old drafts, new session
after completion, two-tab writes, offline queue replay, expired authentication,
same/different-record edits on two devices, deletion versus edit, interrupted
migration, export/import round trip, and upgrade from the previous installed app.

## Implementation status

- Contract recorded. `workoutCompletion.ts` implements stable completion IDs,
  owner/session guards, strict history parsing and one-write completion on the
  existing workspace format. Shared cleanup includes workout/rest timestamps.
- `tests/fixtures/legacy-workspace.json` is synthetic, not exported personal data.
  It preserves old workout/set/template IDs and a live draft without a session ID;
  tests cover additive ID assignment and backup compatibility. The complete
  IndexedDB migration matrix is still pending.
- Canonical storage remains localStorage; snapshots remain the only cloud sync
  protocol. No record-level outbox or local database switch is enabled yet.
- Stage 3a: `utils/persistence/legacyMigration.ts` prepares a validated, pure
  migration candidate. `trainingDatabase.ts` stores records, drafts and metadata
  transactionally in a separate `neurolift-training-v1` database. Explicit account
  keys, draft revision checks, idempotent completion and immutable original-source
  copies are implemented. Runtime imports now exist, but bootstrap activation is
  deliberately disabled pending the remaining stage 3b acceptance gates.
  A failed transaction aborts all its writes; returned promises await `tx.done`.
  Missing legacy exercise/set IDs are assigned deterministically, while existing
  IDs and values are retained. Unsupported/corrupt source stops migration.
- Run `npm run test:persistence` for real Chromium and mobile-WebKit IndexedDB
  checks, including competing connections, two tabs and injected aborts. The
  isolated Vite test page does not bootstrap the app. CI runs this suite too.
- Stage 3b remains: route all runtime mutations through async repository APIs,
  finish settings/collection CRUD, backup/restore/cache deletion and snapshot
  compatibility, add initialization/error/conflict UI and cross-tab refresh.
  Validate full migration/recovery before marking the database canonical. Do not
  enable a candidate opportunistically or use it as a write-behind mirror.
- Re-running migration with a different legacy source is explicitly rejected.
  Integration must reconcile/discard an obsolete candidate with informed recovery
  handling; it must not overwrite candidate edits or silently accept stale data.
- localStorage setItem is atomic for one value, not a multi-tab transaction.
  Stage 2 narrows the crash window but does not claim to solve simultaneous tabs.

### Stage 3b adapter progress (not activation)

The workspace facade now supports an explicitly hydrated IndexedDB view, serialized
write promises, owner-scoped patch transactions, failure status and flush barriers.
Finish, reset, storage CRUD, import/export, account switches and snapshot operations
are prepared to await persistence. Production startup does not call
`initializeWorkspace`; localStorage is still authoritative for installed clients.

Tests cover normalized IDs across consecutive queued writes, empty collection
presence/removal, rollback, failed initialization, stale account responses, and
stale sync acknowledgements. Same-key concurrent edits reject rather than silently
overwrite; different keys can merge. This is not yet per-record cloud merging.
Repeated Finish calls must wait for pending persistence, even when their ID is
already visible in the optimistic read view. Failed writes block following writes.

Activation blockers: remaining direct UI save handlers/effects, durable-save and
recovery UI, full upgrade/import acceptance, cross-tab refresh while a write is
pending, and supported legacy format fixtures. An optimistic view is not evidence
of a saved write. Do not activate this adapter merely because its tests pass.

Follow-up: explicit Journal/nutrition/schedule/onboarding/rest-picker actions now
await writes. Related draft/clock, nutrition rollover, template/schedule deletion
and demo-clear keys are grouped atomically. The initialized-DB path has localized
saving/recovery notices and an owner-scoped recovery export retaining both pending
and durable copies; ordinary backups reuse the export transport. Pending cross-tab
notifications are retained until the queue drains. These are not boot-time recovery
or full migration acceptance. Scope races, stable entry IDs during reorder,
pre-effect draft persistence and old-client fixtures still gate activation.

Oct 26: the shared bootstrap now offers startup recovery and is exercised with
the real App on IndexedDB in `tests/persistence/app-migration.spec.ts`. Production
still passes false. Active exercise edits enqueue before render with stable IDs;
account switches serialize and drain outstanding writes. Corrupted startup retains
raw source and can export an existing candidate. This is not automatic repair or
changed-source reconciliation. The full migration gate remains open.

The additive server foundation is now implemented separately; see RECORD-SYNC.md.
It defaults to legacy snapshots until explicit account migration. No client
outbox/record synchronization is activated, and default local storage is unchanged.

Changed-source startup recovery now offers an explicit choice after export. Schema
2 stores both versions in an owner-isolated archive in the same transaction as the
choice. Original migration source is retained separately from the accepted source.
Stale generation and transaction failure reject without replacement. This closes
the changed-source choice gap, not the remaining full-runtime activation gates.

Oct 26 follow-up: the staged client now has transactional outbox/retry/cursor
application and per-record conflict comparison/resolution, tested in both engines.
See RECORD-SYNC.md for the remaining enrollment and activation gates. Production
bootstrap still passes false; rebuilt Android 24 and iOS simulator 22 keep legacy
mode. The final existing browser suite is green (202 tests) after replacing the
WebKit offline-toggle test with a disconnected-origin test that retains offline
reload/media/API-cache/reopening assertions. This is not real-device acceptance.

### Stage 3 call-site inventory

Before activation, convert `safeStorage` history/journal/template methods,
`useSessionDraft`, `useWorkoutTemplates`, direct Journal history/journal/template
edits, planner schedule mutations, account cache deletion, `DataManager` restore,
and snapshot application. Read-only screens must await initialization or use a
repository subscription; a stale synchronous cache must not overwrite new writes.
The existing `utils/db.ts` database is legacy import-only, not the new canonical
store. Preserve it until migration verification; do not reuse its unscoped stores
as an account-aware database. Inventory nutrition/profile settings as well before
changing the account sync envelope. Every exported category must remain covered.
