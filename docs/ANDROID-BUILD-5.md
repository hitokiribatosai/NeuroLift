# Android 1.3.1 (5): corrected APK handoff and training icon

The previous chat accidentally linked `NeuroLift-debug.apk` (1.3.0, build 4),
which predates the platform layout refinements. Its screenshot shows the old
top navigation and Journal label. The newer platform-refinements APK already
contained bottom navigation. Do not distribute the older APK as the current build.

This build includes the existing corrected phone navigation, a new launcher
icon, and an Android-only version label under More. Layout regression tests
now assert that the phone bar is fixed at the bottom and the desktop brand
is hidden, rather than only testing whether navigation is visible.

## Icon

Generated with the built-in image-generation tool on 2026-10-03. Source artwork:
`android/app/src/main/res/drawable-nodpi/training_mark.png`.
The N represents NeuroLift, plate-like uprights represent strength training,
and the rising right terminal represents progression. Lime and charcoal match
the website. This is a branding interpretation, not a scientific symbol.

Generation prompt:

> Use case: logo-brand. Create final original NeuroLift strength-training app icon, a refined flat athletic monogram combining the letter N with weight plates and upward lifting movement. Square canvas full bleed uniform deep charcoal #17242a. Center one crisp solid pale lime #d7f76b symbol: two bold vertical uprights subtly shaped like stacked barbell weight plates joined by a thick diagonal to unmistakably read uppercase N, with a small clean upward angled terminal on the right conveying progression. Strength-training should be apparent but keep the monogram extremely simple, cohesive and memorable, not a pile of objects. Premium restrained athletic editorial design. Flat vector-like edges, only two solid colors. The entire mark stays within the central 56% width and 56% height of the canvas to support Android adaptive circular masking. Exactly one finished square icon artwork, no mockup, no rounded square container, no outer frame, no words or captions, no AI or brain imagery, no circuits, no glow, no gradient, no texture, no rough edges, no 3D. Aim at legibility as a tiny phone launcher icon.

Android resource XML supplies an opaque charcoal background behind the PNG's
alpha channel. Android 8+ uses adaptive launcher masking; Android 7 uses the
legacy drawable. Existing icon resources remain for rollback. iOS and website
icons are not replaced by this change.

## Validation

- TypeScript, ESLint, 14 unit tests, web production build: passed.
- Chromium: 34 browser tests passed.
- WebKit: 15 browser tests passed (emulation, not a physical iPhone).
- Gradle assembleDebug: passed.
- Exact delivered APK installed over existing emulator app without data clearing.
- Native WebView: bottom tabs on Home and after library scrolling; desktop
  branding hidden; More reports 1.3.1 (5); hardware Back dismisses More: passed.
- APK version and v2 signature verified; min SDK remains 24 (Android 7).

The debug API still points at the emulator host (`http://10.0.2.2:8000/api`).
Physical-phone login/sync requires a reachable backend; offline/local features
can be tested without it. This is not a signed production/Play Store release.
