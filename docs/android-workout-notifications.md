# Android workout notification

Android-only Capacitor plugin `WorkoutNotification`; no iOS implementation or server is needed.

## User behavior

- The first Start Session offers Android notification permission. Existing sessions have an Enable workout notification button.
- A quiet, expandable card shows the selected exercise, muscle group and next unfinished set. Completed exercises say all sets logged.
- Completing a set starts Android's system-rendered countdown, based on the same absolute deadline as the in-app rest timer.
- Adding rest time replaces the scheduled alarm. Skipping rest cancels it. Finishing/resetting a session or turning notifications off clears the card and pending alert.
- Tapping the card opens Workout. The setting remains on the device; it is not synced to other devices.
- The card works across app-section navigation. Workspace/account changes reconcile it to the current draft.

## Timing and privacy

The ongoing channel is silent; the separate rest-complete channel can alert once when the app is in the background. Foreground rest sound remains handled by the existing app timer. There is no per-second bridge polling, foreground service, wake lock or remote push service for this feature.

On Android 12+, exact background alarms require the user to allow **Alarms & reminders**. Without that access, the countdown still renders, but Android may delay the rest-finished alert in sleep/battery-saving modes. The app offers a settings shortcut, checks permission before scheduling and falls back safely if it is revoked. Force-stopping the app prevents scheduled alerts; restarting the device removes notifications/alarms until the app is reopened. System notification/channel settings always take precedence.

Notification width, expansion and lock-screen visibility are controlled by Android. Private visibility and a generic NeuroLift public version avoid exposing exercise details on restricted lock screens. Only notification text and a rest deadline are stored in the native private preferences, not account credentials or workout history. Data is cleared when the notification is cleared.

## Verification

- `npm run check`
- `npx playwright test --workers=2`
- Prepare Android assets with `VITE_API_URL=<public HTTPS API>/api npm run android:build`.
- With Java 21 and an emulator: `bash gradlew :app:connectedDebugAndroidTest` from `android`.

Native instrumentation tests cover countdown flags/deadlines, private visibility, extension/stale alarms, cancellation, background completion, the JavaScript/native bridge, notification tap navigation, real set completion and disabling the feature. They temporarily seed a synthetic guest draft and restore the previous test-device storage afterward. Real Samsung lock-screen/battery-saving behavior still needs physical-device confirmation.
