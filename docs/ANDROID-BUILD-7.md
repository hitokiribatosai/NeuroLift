# Hosted preview — Android 1.3.3 (7)

- Backend: `https://neurolift-api-preview.onrender.com/api`.
- Website: `vercel.json` forwards `/api/*` to the same backend. No secret is embedded in the frontend. Keep `VITE_API_URL` unset on Vercel to use this route.
- Android assets use the public HTTPS endpoint, with cleartext, mixed content and WebView debugging disabled. The APK is debug-signed for testing, not a Play Store release.
- App ID and debug signing key are unchanged. Install over build 6; do not uninstall first. Export a workout backup before updating.
- Requests allow 90 seconds for Render Free cold starts. The first account action after inactivity can be slow.
- Resend's test sender is restricted to the owner's email until a sending domain is verified. Real signup/email/sync testing is still required.
- Tokens remain in memory: restarting the app requires signing in again.
- iOS was not rebuilt or modified for this release.

Reproduce on the configured Mac:

```sh
VITE_API_URL=https://neurolift-api-preview.onrender.com/api npm run android:build
node scripts/verify-native.mjs android
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ANDROID_HOME=/Users/rahalabdelilah/Library/Android/sdk sh android/gradlew -p android :app:assembleDebug --console=plain
npm run build
```

Preparing Android assets and the website both write `dist`; run them sequentially, not during browser tests.
