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

- Contract recorded. Stable completion and migration fixtures are the first code
  stage; later gates remain pending until recorded as verified in the handover.
- localStorage setItem is atomic for one value, not a multi-tab transaction.
  Stage 2 narrows the crash window but does not claim to solve simultaneous tabs.
