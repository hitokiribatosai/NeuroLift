# iOS rest alerts — stage one

Implemented 2026-10-12 using the already-installed Capacitor LocalNotifications plugin. This is a local, offline-capable rest-finished alert, **not** a Live Activity or Dynamic Island countdown. No backend/push credentials or new native entitlement is needed for local notifications.

- Starting a session offers notification permission if no choice has been recorded. Optional Rest alerts controls are in Settings (EN/FR/AR), not at the top of Workout.
- The global `useIOSRestNotification` hook derives state from the saved workspace using the existing `workoutNotice` snapshot. It remains mounted when leaving Workout.
- `createIOSRestScheduler` serializes bridge calls and deduplicates snapshots. A single reserved ID (6201) schedules the absolute rest deadline; an extension replaces that request. Skip before expiry cancels it; finish/reset/disable/account switch cancels it and removes only this feature's delivered alert.
- An ordinary JS timer-expiry update must not cancel the OS request at the same instant. No expired countdown is newly scheduled. Tap opens `#tracker`; no lock-screen set-completion actions are included.
- Native foreground presentation is suppressed with the plugin's `silent` flag so the in-app three-beep sound remains responsible. Background delivery requests the bundled `neurolift_rest_beeps.wav` three-tone sound, included in the Xcode Resources phase. Focus, mute and notification settings can silence or alter presentation; audible playback on a real iPhone still needs confirmation.
- Denied permission never prevents workout logging. Instructions point to iPhone Settings; no Android exact-alarm flow is shown on iOS. Permission is rechecked on resume. The opt-in is device-local, not account-synced.

## Verification and next stage

Unit tests cover scheduling/deadline replacement, deduplication, skip/finish cleanup, unrelated notification preservation, expiry race, permission denial, serialized operations and failure recovery. Browser platform mocks are not native notification-delivery tests.

Before calling this device-verified: on simulator and then physical iPhone, allow permission, complete a set, background/lock, observe the alert, tap it, extend/skip and finish/reset, deny permission, reopen offline, and verify no duplicate foreground sound. Inspect pending native requests when diagnosing; do not rely solely on an injected test notification. No physical-device pass is claimed here.

Stage two requires a separately implemented ActivityKit/SwiftUI extension for the persistent Lock Screen card and optional Dynamic Island layouts. The generated concept images are illustrative only, not evidence of implementation.
