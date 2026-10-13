# Platform-adapted navigation

## Scope and rollback

The modern interface is enabled for web, Android and native iOS (`utils/interfacePlatform.ts`, updated 2026-10-13; an earlier revision of this guide kept iOS on the legacy interface). The annotated tag `layout-before-platform-refinements-2026-10-03` points to `2bcb593`, the pre-refinement baseline, and is published on GitHub.

## Layout rules

| Width / platform | Navigation | Selection workflow |
| --- | --- | --- |
| Up to 800 CSS pixels, web | Fixed bottom tabs; compact page header | Muscle sheet, fixed selected-count/review actions |
| Up to 800 CSS pixels, Android | Same structure with Android touch sizes and safe-area spacing | Same selection workflow; hardware Back closes the top overlay first |
| 801–1100 CSS pixels | Compact labeled side rail | Inline muscle selectors and review dialog |
| Above 1100 CSS pixels | Full sidebar | At 1200px+, a persistent right-hand selected-exercises panel |

Width, not user-agent detection, decides layout. Android platform detection is used only for native behavior. The sidebar mirrors in RTL. Bottom tabs have icons and labels: Home, Workout, Exercises, Progress, More. Secondary destinations open in a bottom sheet on phones. Settings remain available in the header and More.

## State and navigation

- Library search, muscle, subgroup, research filter, workout-picker search/groups and focused session exercise are stored per workspace using non-synced `ui_*` keys.
- Scroll positions are retained per destination for the current app lifetime; browser Back/Forward restores the destination.
- Existing saved workout sets, selections and clock state remain authoritative. Changing tabs does not rewind the workout phase.
- A Resume workout strip appears outside an active workout.
- Modern Android has one hardware Back owner. It dismisses the top overlay, traverses in-app navigation, returns to Home, then minimizes the app at the root. It never discards a session.
- The Android-only Back dispatch (`neurolift-screen-back`) lets Tracker step back through active → selection → setup before destination history. Website browser Back and native iOS navigation do not use this dispatch.
- The visual viewport and input focus detect keyboard opening. Phone tabs temporarily hide, fixed action bars return to document flow, and the edited input remains reachable.
- Modern page transitions avoid transformed ancestors, which otherwise trap fixed-position action bars inside scrolling content.

## Validation

Run `npm run check` and `npm run test:browser`. If portable browsers are not installed, use `npx playwright install chromium webkit`; `PLAYWRIGHT_CHANNEL=chrome npm run test:browser` uses an installed Chrome. Run `npx playwright test --config playwright.webkit.config.ts` for WebKit with iPhone browser settings.

The regression suite covers five viewport widths, persistent tabs, saved filters and scroll, browser history, selection review, workout resumption, RTL/large text, PWA offline behavior, and native interface selection. Native emulator checks additionally cover hardware Back and the real soft keyboard.

Physical iPhone/Safari and physical Android acceptance testing remain recommended before release. WebKit device emulation is not a physical-device test. Test APKs/iOS builds now bundle the HTTPS preview API (see `PROJECT_HANDOVER.md`); they are debug-signed and not store releases.
