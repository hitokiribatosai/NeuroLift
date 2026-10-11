# Guided introduction and first workout

The website, Android and iOS modern interface share an optional, translated tour.

- After the existing welcome/goal screens, Home offers **Take a quick tour** or **Explore on my own**. Existing visitors receive the same non-blocking invitation.
- The overview introduces Workout, Exercises (including available demonstrations, external videos and research), Progress, and Settings/extra tools. Back/Next visit the corresponding section; external links are never opened automatically.
- **Build your first workout** enables inline hints driven by the actual tracker phase and completed sets. Users choose their own muscle groups/exercises and perform every logging action themselves.
- Skip leaves all training data intact. Home offers a resume invitation; Settings → Help & tour always offers overview/workout replay, including during an active session.
- State uses the versioned device-local `neurolift.device-tour.v1` key, not cloud workspace data. Disabled storage never blocks training. Workout progress comes from the existing saved workout, not a duplicate tutorial session.
- Hints are in normal document flow: they do not obscure inputs, grab focus, auto-scroll during a set, or add animations. Text/actions support English, French and Arabic and inherit the platform safe areas, theme and text size.

Browser tests cover all three platform modes, overview navigation and Back, skip/replay, selection preservation, guided real-set completion, reload/offline operation, first-visitor dismissal and narrow/tablet/desktop RTL layouts. Browser platform mocks are not physical-device verification. Native installs need a new compiled app to include these changes; a Git push cannot update an installed APK/IPA.

Validation: typecheck, lint, 14 unit tests and production build passed. The full Chromium suite (53 tests) and mobile WebKit suite (33 tests) passed, followed by all 9 final tour tests in each engine after adding multi-muscle and RTL viewport coverage. Android/iOS release web assets were prepared and their native-asset checks passed. The production build still reports its existing large-JavaScript-chunk advisory.
