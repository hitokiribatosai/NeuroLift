# Device acceptance — October 28, 2026

Use synthetic workouts/accounts. Export your existing data before installing an
update; do not uninstall or clear storage to update a test build. Git checkpoints
do not back up phone data. The owner will test the Samsung and arrange physical
iPhone testing; simulator results do not certify a physical iPhone.

## Current build scope

The next test versions are Android 1.3.22/build25 and iOS 1.3.22/build23. Consult
PROJECT_HANDOVER.md for actual build success, hashes and simulator observations.
They keep production legacy storage enabled. Shared event-time draft persistence
and editor refresh protection are included. New database enrollment/recovery
controls remain staged, covered by browser tests, and are NOT enabled in these
binaries. Do not report a phone test as validation of record migration yet.

## On the Samsung (and repeat on a physical iPhone when available)

1. Install the update over the previous build. Verify previous history/routines
   remain, and an unfinished session can still resume.
2. Choose two muscle groups and three exercises. Leave and reopen the app before
   starting. Confirm selections and routine title are retained.
3. Start training, enter weights/repetitions, complete a set, reorder exercises,
   swipe cards, and edit a middle-card field. Check keyboard, scrolling, menus,
   top safe area and bottom navigation.
4. Lock the phone during rest. Check the notification countdown and end sound.
   Reopen; verify elapsed workout/rest times. Do not assume foreground tests prove
   background notification delivery.
5. Turn on airplane mode. Record a set, close and reopen, finish the workout, then
   reopen again. Confirm history contains exactly one completed workout and the
   next workout has no leftover exercise selections or search text.
6. Save a routine, start it again manually, and confirm previous weights are
   references rather than automatically completed new sets.
7. Export a backup and confirm the file exists outside the app. Test import only
   in a disposable account/workspace; importing may replace saved categories.
8. With test credentials, sign in online, make a change, leave the editing screen
   and synchronize in Account. Verify it on another client. Sign out and confirm
   guest history is separate. Never send passwords/tokens in screenshots.

Record device, OS, build number, exact steps, expected/actual result and a
screenshot/video if useful. Mark tests not attempted as untested, not passed.

## Still required before default record-storage rollout

- Finish clock persistence/runtime acceptance and verify canonical storage with
  upgrade fixtures and repeated interruption tests.
- Run PostgreSQL concurrency/load and isolated backup/restore verification.
- Exercise old-cache export/reconciliation, explicit account upgrade, fresh-device
  join, two-account isolation and conflicting changes on two real devices using
  dedicated accounts once a gated native build is approved.
- Never migrate a live account with old installed clients still in use: upgraded
  accounts reject legacy snapshot writes.
