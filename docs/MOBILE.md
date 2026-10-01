# Android on Windows; iOS on macOS

This repository uses Capacitor 8 and Swift Package Manager for iOS.
Use Node 24.15+ for this project's tooling, Java 21 and Android SDK 36 for Android.
Use Android Studio Otter (2025.2.1) or newer. For iOS use a Mac with full
Xcode 26+ and an installed simulator runtime; command-line tools alone do not
include the iOS SDK. See https://capacitorjs.com/docs/updating/8-0.

## Android debug on Windows

```powershell
npm ci
npm run android:debug
npm run android:open
```

The emulator uses http://10.0.2.2:8000/api to reach the host's Django.
Add 10.0.2.2 to DJANGO_ALLOWED_HOSTS for this local setup. Both
https://localhost and http://localhost must be allowed in CORS if you change
the WebView origin. Debug manifests permit HTTP; release manifests do not.

Select Java 21 as the Gradle JDK in Android Studio, install SDK 36, and run the
app on an emulator. Or run `android/gradlew.bat -p android assembleDebug`.
For a real device, use an HTTPS preview API by setting VITE_API_URL, or a trusted
LAN debug backend bound to its LAN interface with exact host/CORS settings.

## iOS debug on Mac

```sh
npm ci
npm run ios:debug
npm run ios:open
```

Choose the App scheme and an iPhone simulator. The default API is
http://localhost:8000/api, with local networking allowed only in Debug Info.plist.
Use the HTTPS preview API for physical devices. No CocoaPods install is needed.
SPM paths are normalized after sync so Windows-generated separators cannot
break a checkout on the Mac. Swift dependencies use the locked Capacitor version.
Open ios/App/App.xcodeproj, not a nonexistent CocoaPods workspace.

Email links open the web frontend, where the user confirms verification/reset.
Then sign in inside the native app. Universal links require your future domain,
Apple association files and provisioning; they are not claimed as configured.

## Release assets and signing

Set VITE_API_URL to your public HTTPS API, then run `npm run android:build`
or `npm run ios:build`. These commands build and sync with debug settings off.
Android release and Xcode Archive run an asset check that rejects debug bundles.
Do not manually copy a web-only build into a release.

Android signing reads NEUROLIFT_KEYSTORE, NEUROLIFT_KEYSTORE_PASSWORD,
NEUROLIFT_KEY_ALIAS and NEUROLIFT_KEY_PASSWORD from environment variables.
Never commit the keystore or credentials. Then build `bundleRelease`.
Choose your Apple development team in Xcode and manage distribution signing
through your Apple account. The repository does not include signing credentials.
Existing app ID com.neurolift.app is preserved; confirm ownership before launch.

App version is 1.3.0/build 4 on both platforms. Increase build numbers for uploads.
The privacy manifest includes filesystem timestamp access for backup export.
Review all declared data types and store disclosures against the final behavior.

## Required device checks

Test email flows, two-device sync/conflicts, reload and offline edits, correct
exercise demos, keyboard/form access, safe areas, Arabic layout, notifications,
background timers, backup export/import and account deletion. Reject release
if a debug WebView or HTTP API is present. App stores, native compilation and
signing need the corresponding developer tools/accounts; a web build alone
does not establish store readiness.
