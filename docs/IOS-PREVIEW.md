# iOS preview — 1.3.14 (15)

## Latest verification — 2026-10-14

Rebuilt Debug simulator app with the latest lazy-loaded screens and repeat-workout references. Release-safe bundled assets use the HTTPS preview API; native asset checks and Xcode simulator compilation passed. The compiled `public/` directory matches synchronized source assets byte-for-byte. Installed over the existing app on iPhone 17 / iOS 26.5 without erasing data; Home, the preserved workout draft and the lazy-loaded exercise library rendered successfully. Notification permission was declined in this simulator check. This is a native smoke check, not full hardware, offline cold-launch, audible-alert or keyboard acceptance.

Local artifact: `builds/ios/NeuroLift-1.3.14-build15-ios-simulator.app`. This simulator app cannot be installed on a physical iPhone; use an Xcode device build with the owner's signing team. No Live Activity/Dynamic Island feature was added. Older verification paragraphs below are historical.

The iOS runtime now selects the approved modern interface, retains its existing native theme preference, updates status-bar contrast with the theme, and uses CSS safe areas instead of automatic WKWebView content insets. The launcher uses the same training artwork as Android and the website.

Prepare assets:

```sh
VITE_API_URL=https://neurolift-api-preview.onrender.com/api npm run ios:build
node scripts/verify-native.mjs ios
```

Xcode is installed at `/Applications/Xcode.app`. Use `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` for command-line builds; the machine's global selection need not be changed. Open `ios/App/App.xcodeproj`, scheme `App`.

Simulator development does not require a signing team. Installing on a physical iPhone requires the owner's signing setup and device approval. Do not distribute a simulator `.app` as an iPhone installer.

Browser validation: 14 unit tests, 45 Chromium tests and 25 WebKit tests passed initially, along with lint/typecheck/build and iOS native-asset checks. After compacting phone onboarding and adding a safe-area regression, all 7 focused WebKit theme/onboarding tests and the full lint/typecheck/unit/build check passed again. The Debug simulator app compiled successfully with Xcode 26.5 and launched on iPhone 17 Pro (iOS 26.5). Native onboarding completion, Home, exercise-library navigation and the phone-sized muscle picker were visually checked. The welcome-screen status-bar overlap was corrected and verified after rebuilding. Native scrolling, keyboard, rotation, full workout flows and physical-device checks remain pending before release.

Email verification is still restricted by the Resend test sender; cross-device login/sync and persistent sign-in remain separate work. No Apple signing credentials or App Store submissions are included.

Follow-up: Capacitor core/Android/iOS are pinned to 8.5.3 and source-map-js was updated; npm audit reports zero vulnerabilities. A clean native simulator build succeeded and launched on iPhone 17 (iOS 26.5). The latest checks passed 14 unit tests and 28 WebKit tests, including keyboard viewport panning and offline workout persistence. The unfinished native workout survived relaunch. Native swipe behavior remains unresolved, full native workout completion was blocked by simulator input-control errors, and native offline cold launch still requires network-isolated verification. These are not release-ready claims.

After restarting Simulator, native taps worked again. A full one-exercise workout completed through the installed app (Incline Dumbbell Press, 15 kg × 8 reps, 120 kg total volume), and the completed-session count survived termination/relaunch. Keyboard Tab navigation revealed the set fields; native swipe scrolling remains unverified, with automated gestures also failing on Springboard. Native offline cold launch is still pending real network isolation.

The user subsequently clarified that manual scrolling does work; pressing and holding selects text. Record manual scrolling as user-confirmed, with ease/smoothness still needing physical-device evaluation. Automated swipe verification remains inconclusive. The guided introduction added afterward has browser coverage across web/Android/iOS modes; the previously installed simulator build does not yet contain that tour.
