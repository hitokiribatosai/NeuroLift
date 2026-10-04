# Android phone polish — 1.3.2 (6)

Addresses physical-phone screenshots of build 5:

- The top header is sticky, keeping Settings reachable while scrolling.
- A fixed opaque system-status-bar shield prevents content from appearing behind
  clock/battery icons. Insets use the maximum of browser safe-area environment
  values and Capacitor 8's injected native safe-area CSS variables. Bottom tabs
  also reserve the native gesture-area inset.
- Feature toolbars sit below the measured header, including enlarged text.
- Modern navigation containers no longer inherit legacy white nav backgrounds.
  This removes square patches behind the Settings control and workout cards.
- The main focus target no longer draws a stray green outline across content;
  keyboard focus indicators on interactive controls remain.
- Muscle sheets constrain grid minimum widths, wrap all muscle/area choices into
  two or three columns, and scroll vertically. A translucent blurred backdrop
  overrides the old light-theme background rules.
- Local status now says Saved on this device and offers Sign in to sync. Offline,
  conflict, account-sync, and storage-error states remain distinct.
- Workout cards, progress bars, action spacing, and horizontal scrollbar styling
  are refined. Circular action buttons do not shrink into ovals.
- Small view/sheet entrance transitions and one-time dashboard-card reveal motion
  respect reduced-motion preferences. No transform is applied to the page shell,
  preserving fixed controls. Content remains visible without animation support.

Scope: modern web/Android UI only. iOS legacy UI and project files are unchanged;
the new Android launcher icon from build 5 is retained. No backend changes.

Validation: typecheck, lint, 14 unit tests, 38 Chromium and 19 WebKit browser tests,
production web build, Android debug build, and APK signature verification passed.
Browser tests cover 360/393/412px phones with simulated system insets, tablet and
desktop widths, Arabic/enlarged text, dark mode, reduced motion, sheet containment,
sticky settings, sync, workout persistence and offline PWA behavior.
Actual Android emulator checks cover installed version, native safe-area insets,
sticky header after a native swipe, bottom tabs, sheet containment/backdrop and
hardware Back. Physical-phone confirmation is still required.

Build 6 still uses the emulator-only debug API address. Login/sync from physical
phones requires configuring a reachable backend and rebuilding.
