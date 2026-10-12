# NeuroLift project handover

Last reviewed: **2026-10-12**. Read `AGENTS.md` first on recovery.

## 1. Snapshot and evidence boundaries

- Repository: https://github.com/hitokiribatosai/NeuroLift ; working branch `main`.
- Application baseline at this review: `b0a87f1` (`Fix workout tracking, routine history and mobile journal layout`). This initial continuity commit adds documentation only; see **local-only work** below.
- Owner plans to change Codex accounts around October 15–16, 2026. Maintain these files after meaningful work, not just on the final day. No scheduled automation has been created.
- Source/configuration and Git status were inspected for this handover. Earlier test outcomes are labeled historical below; live hosting, inbox delivery and remote CI were not reverified in this documentation session.
- A fresh clone does **not** yet contain the latest local application changes or the local APK. Before switching machines/accounts, use “Prepare handover” to review, commit and push appropriate application changes.
- Initial documentation push status must be confirmed from the actual Git command result; do not infer it from this file's existence. Check `git status -sb` and remote branch equality on recovery.

## 2. Project and product intent

NeuroLift is a workout planner/tracker, exercise library and training journal for desktop/mobile web (PWA), Android and iOS. Gym users can choose multiple muscles/exercises, log real sets, save reusable routines, plan a week, review progress and optionally sync records through accounts. Guest/local use must remain useful offline.

Owner preferences: no AI coach or AI-dependent product; training-focused branding; modern, clear shared design with platform-adapted navigation; evidence links rather than claims that an exercise is universally “scientifically proven.” Local development first, temporary zero-cost preview infrastructure, paid production infrastructure only after discussion. No advertising implementation is approved by this record.

## 3. Stack and architecture

| Area | Source / responsibility |
| --- | --- |
| Frontend | React 19, TypeScript 5.8, Vite 6, Tailwind 4, Framer Motion; `App.tsx` hash destinations and providers |
| Modern UI | `components/web/WebExperience.tsx`, `WebSession.tsx`, `website.css`; `utils/interfacePlatform.ts` enables modern UI for web, Android **and iOS** |
| Training | `components/features/Tracker.tsx`, `ProgramPlanner.tsx`, `Journal.tsx`; utilities for templates, schedules, validation, history, substitutions and plate calculations |
| Content | `utils/exerciseData.ts`, `exerciseMedia.json`, `exerciseEvidence.ts`, `trainingEvidence.ts`, `formCues.ts`; bundled media and attribution in `public/exercises/` |
| Account/storage | `utils/authService.ts`, `workspace.ts`, `sync.ts`, `validateBackup.ts`, `dataManager.ts`; `components/features/Account.tsx` |
| Preferences/tour | `contexts/` for language/theme/font/gym mode/clock; `components/web/GuidedTour.tsx` |
| Offline | `scripts/build-sw.mjs`, `sw-template.js`, `utils/sw-registration.ts`; cache app assets, not API responses |
| Native | Capacitor 8 (core/android/ios pinned 8.5.3); `android/`, `ios/`, `capacitor.config.ts`; iOS Swift Package Manager, not CocoaPods |
| Backend | Python, Django 5.2 LTS, Gunicorn, WhiteNoise, django-cors-headers, psycopg; `backend/config/`, `backend/api/` |
| Database | SQLite for simple local development, PostgreSQL for hosted use; User, hashed AccessToken digest, versioned Snapshot, RateBucket models |
| Quality/deployment | Vitest, Playwright Chromium/WebKit, ESLint, TypeScript, Django tests; `.github/workflows/ci.yml`, `render.yaml`, Docker Compose |

Data flow: UI writes the current workspace; signed-in sync exchanges a versioned account snapshot with Django. Passwords use Django hashing, not plaintext. Tokens remain in memory, so reload requires login again for sync. Guest and account caches are separate. Themes, active workout drafts, clocks and UI preferences are device-local. Account snapshots include history/templates/journal/nutrition/profile. Conflicting versions require a user choice; this is not real-time record-level merging. Limits documented in development guide: 1.5 MB snapshot / 5,000 records per collection. Cache is not app-encrypted.

## 4. Implemented baseline

- Responsive modern UI, mobile bottom navigation, safe-area/keyboard handling, light/dark themes, EN/FR/AR, RTL and text-size controls. Native/browser tests do not guarantee every physical device layout.
- Multi-muscle/subgroup exercise selection, available two-frame demonstrations, external video links, research references and honest missing-media fallbacks. Existing docs report 168 demonstrated exercise names; not recounted during this handover. Preserve media attribution/licenses and avoid inaccurate name-only substitutions.
- Workout sets, weights/reps, rest timers, previous performance, history, saved templates, weekly routines and progress insights. Starting a template is intended to start a new session rather than mark previous sets complete.
- Optional welcome/quick tour and guided first real workout, skip/back and replay from Settings; tour is device-local and does not create dummy user workouts.
- Django registration, explicit email verification, password reset, expiring bearer sessions, account deletion, snapshot sync/conflicts; backup import/export with validation; guest offline use.
- Prior `b0a87f1` fixes cover workout tracking, routine naming/history, mobile journal and progress issues. Inspect its diff/tests for exact behavior instead of reimplementing from chat descriptions.
- Native build preparation, release asset checks, dependency patches and CI definitions exist. Store publication and production certification are **not** complete.

## 5. Latest local-only work — important migration gap

At initial setup, these remain uncommitted and are deliberately NOT included in the documentation-only commit:

1. Gym feedback fixes: clear finished-session selections/picker search before a fresh workout; swipe plus Previous/Next within the set card; outside-tap/Escape closes per-set menus. Files: `Tracker.tsx`, `WebSession.tsx`, `website.css`, `tests/browser/refinements.spec.ts`.
2. **Android-only workout notification**, requested before any iOS equivalent:
   - Ongoing quiet card shows current exercise/muscle/next set; set completion changes it to a system chronometer countdown. Background rest completion can alert once; tap returns to Workout; finish/reset/disable clears card/alarm.
   - Native plugin files under `android/app/src/main/java/com/neurolift/app/`: `WorkoutNotificationPlugin.java`, `WorkoutNotifications.java`, `WorkoutRestReceiver.java`; registration in `MainActivity.java`, manifest permissions/receiver.
   - Bridge `utils/androidWorkoutNotification.ts`, global `hooks/useAndroidWorkoutNotification.ts` wired in `App.tsx`, `components/web/AndroidWorkoutNotificationControl.tsx` inside WebSession.
   - Native tests in `android/app/src/androidTest/java/com/neurolift/app/WorkoutNotificationsTest.java`, corrected sample test app ID; unit snapshot tests in `tests/unit/androidWorkoutNotification.test.ts`.
   - Design: opt-in notifications; native AlarmManager with optional exact-alarm access; inexact fallback. No foreground service/per-second JS polling. Private lock-screen content. No iOS implementation.
   - Android version **1.3.8 / build 12**, debug-signed testing APK built with HTTPS preview API. Notification details/limits in local-only `docs/android-workout-notifications.md`.
3. `ios/App/App.xcodeproj/project.pbxproj` has pre-existing local signing/Xcode formatting and version changes (**1.3.7 / build 11**, personal development team/debug bundle). Preserve and review separately; do not blindly publish personal signing configuration. No iOS notification feature added.
4. Untracked `work/` contains generated native build products/dependency checkouts. **Do not `git add .` or publish it.**

Current-machine paths (not portable):
- Checkout: `/Users/rahalabdelilah/Documents/Codex/2026-10-01/fet/work/NeuroLift`
- APK: `/Users/rahalabdelilah/Documents/Codex/2026-10-01/fet/outputs/NeuroLift-1.3.8-build12-android-test.apk`
- APK SHA-256: `47875c677c6d6f682e5e9ac4b13b692d027d8b2d15b5db09deb31a037bdf0cfb`

## 6. Verification ledger

Reported/observed in the preceding development work on this local snapshot, not rerun by this documentation-only setup:

| Check | Actual recorded outcome / limits |
| --- | --- |
| Typecheck, lint, unit tests | Passed; 22 unit tests |
| Web build / native asset preparation | Passed; existing large-JS-chunk advisory |
| Chromium browser regressions | 64 passed |
| Earlier gym-fix WebKit regression | 42 passed; not a fresh run after notification integration |
| Android instrumented suite | Final run: 4 passed on API 36 emulator, `BUILD SUCCESSFUL` |
| Android asset check / diff whitespace | Passed immediately before APK handoff |
| Backend, live auth/email, remote CI | Not retested for notification work or this documentation setup |
| Physical Samsung notification/battery behavior | Still needs owner testing |
| New iOS build/notification testing | Not performed for Android-only notification change |

Native test cleanup was corrected to restore storage without reloading a finishing activity, wait for activity destruction and await asynchronous notification cancellation. Production code also handles JS observing rest expiry before the native alarm, avoiding loss of the background alert. Native tests exercise the WebView bridge, notification tap, set completion, countdown, stale/extended alarms and cancellation.

## 7. Development, configuration and builds

Use Node 24.15+ (see `package.json` engines), Python 3.13+, Java 21 / Android SDK 36. iOS requires macOS and full compatible Xcode (guide targets 26+). Use lockfiles; do not upgrade dependencies casually.

```sh
npm ci
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env  # only if it does not already exist
backend/.venv/bin/python backend/manage.py migrate
backend/.venv/bin/python backend/manage.py runserver
# Separate terminal:
npm run dev
```

Frontend localhost:3000 proxies `/api` to Django localhost:8000. Local console email is the default; Docker Compose provides local Postgres/Mailpit. See `docs/DEVELOPMENT.md` for Windows commands and sync behavior.

```sh
npm run check
npm run test:browser
npx playwright test --config playwright.webkit.config.ts
backend/.venv/bin/python backend/manage.py test api
```

Native preview preparation:

```sh
VITE_API_URL=https://neurolift-api-preview.onrender.com/api npm run android:build
# From android/, with JAVA_HOME and ANDROID_HOME configured:
bash gradlew :app:assembleDebug
bash gradlew :app:connectedDebugAndroidTest
# iOS when requested:
VITE_API_URL=https://neurolift-api-preview.onrender.com/api npm run ios:build
npm run ios:open
```

The npm native `:build` command prepares release-safe web assets; it is NOT itself a signed APK/IPA distribution build. Open `ios/App/App.xcodeproj`. Use unsigned simulator builds for initial verification; physical iPhone requires the owner's signing/provisioning. Use `:app:` prefixes for Android instrumentation to avoid unrelated dependency test projects. Existing Mac tools: Java at `/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`, SDK at `/Users/rahalabdelilah/Library/Android/sdk`, AVD `NeuroLift_API_36`. Recheck availability on another account/machine.

Config names only: frontend `VITE_API_URL` is public; backend `DJANGO_SECRET_KEY`, `DATABASE_URL`, `RESEND_API_KEY` are secrets and must never be VITE variables. Backend also needs correct `DJANGO_ALLOWED_HOSTS`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `EMAIL_BACKEND`, `DEFAULT_FROM_EMAIL`, debug/proxy settings. Preserve existing local env files; never print/commit their contents.

## 8. Hosting and limitations

- Public website supplied by owner: https://myneurolift.vercel.app ; preview API used in build12: https://neurolift-api-preview.onrender.com/api . Earlier conversation records Render deployment work with Neon PostgreSQL and Resend email. Current uptime/configuration/delivery were **not** inspected during this setup.
- Some older documents are stale: `docs/PREVIEW-SETUP.md` says nothing provisioned, `docs/PLATFORM-LAYOUT.md` says iOS legacy-only, and `docs/MOBILE.md` lists old build numbers. Source and this dated status take precedence; verify before relying on any readiness claim.
- Email without an owner-verified sender domain remains restricted in the documented Resend test setup. A Gmail inbox is not a verified sending domain. Owner authorized a recipient in chat, but do not expose personal addresses here or assume actual inbox delivery succeeded.
- Native binaries require rebuild/reinstallation; pushing GitHub or deploying Vercel never updates an installed APK/IPA automatically.
- Free preview services can sleep/timeout and have quotas. No production uptime, backups/restore rehearsal, monitoring or public email-readiness is certified.
- Android countdown works natively, but exact background alerts require optional Alarms & reminders access on newer Android. Battery-saving policies need Samsung testing. Force-stop prevents alarms; reboot clears them until app reopening. System controls card dimensions and expansion.
- iOS simulator tests are not physical iPhone acceptance. Owner has Samsung and may use brother's iPhone. Preserve portrait/keyboard/safe-area priorities; do not mistake long-press text selection for proof that swipe scrolling is broken.
- Persistent secure native login, Universal/App Links, production signing/store submission, privacy/support publication, verified public email and operational backups are remaining release work; no ad SDK is integrated.
- Self-hosting was discussed, not implemented; do not migrate providers without user direction.

## 9. Prioritized next steps

1. Before account migration, review local-only source and iOS signing diff, rerun relevant checks, then “Prepare handover” to commit/push appropriate work. Verify remote commit IDs. Keep generated builds and credentials out of Git.
2. Owner tests build12 on Samsung: notification permission denied/allowed, background/lock screen countdown, rest extension/skip/end/reset, tap navigation and battery saver; reproduce and fix actual failures.
3. Verify the three gym fixes on physical device and preserve workout history/templates across upgrade; export a backup first. Don't uninstall to troubleshoot casually.
4. Rebuild/test iOS shared fixes when requested; add an iOS live-workout notification only after separate design/authorization. No Dynamic Island capability is currently claimed.
5. Recheck live website/backend, verification/reset and two-device sync/conflict/offline recovery. Resolve verified sender/domain and production gates before public launch.
6. Update stale guides selectively, investigate bundle size/accessibility/localization gaps, and continue prioritizing real gym feedback over extra features.

## 10. Recovery and handover checklist

Read `AGENTS.md` → this file → `git status -sb`, `git log -5 --oneline`, `git remote -v` → relevant code/tests. Compare local-only list with actual files; a clone may legitimately lack those changes. Summarize verified status and wait for the next task. For “Prepare handover,” follow the commit/push procedure in `AGENTS.md` and report exact commit/branch/push status plus anything still local. Never interpret a historical test pass as a current deployment guarantee.
