# Android 1.3.4 (8) — design polish

Web and Android now use high-contrast selected Settings options, single-line compact bottom-tab labels, neutral scrollbars, and a highlighted primary account action. Settings selections also expose their pressed state to accessibility tools. Styles are scoped to the modern design; iOS retains its existing appearance.

The bottom tabs keep their 64px/68px minimum touch targets while their labels use a compact 11–12px range. Page content continues to honor the selected font size. The navigation height is still measured for safe-area/footer spacing.

Built with the same HTTPS backend and debug signing key as build 7. This is a testing APK, not a store release. Install over the existing app; export a backup first and do not uninstall.

Validation: 14 unit tests, 43 Chromium tests, 23 WebKit tests, typecheck, lint, production build, native asset safety check and Android compilation. Screenshots of settled light/dark Settings were reviewed. Android presentation is browser-simulated; physical-device verification remains pending.

Build using the commands in ANDROID-BUILD-7.md. Authentication limitations and owner-only Resend test delivery are unchanged.
