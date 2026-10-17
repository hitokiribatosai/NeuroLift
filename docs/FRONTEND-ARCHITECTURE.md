# Frontend maintenance guide

## Ownership

- `Tracker.tsx` coordinates workout transitions and connects the screens. Keep new dialogs and picker UI in focused components, not inline in the coordinator.
- `TrackerSetup`, `TrackerSelection`, `TrackerTemplatePicker`, `TrackerTemplateEditor`, and `TrackerReorderDialog` render their respective workflows. `WebSession` renders the active session on web, Android and iOS.
- `useSessionDraft` owns device-local draft initialization and persistence. Keep existing keys compatible; schema changes require migration tests.
- `clearSessionDraft` defines the persisted cleanup boundary. Finish saves first and shows a summary; reset discards the draft. Neither may delete history, routines or preferences.
- `useWorkoutTemplates` owns routine loading and persistence; editing and selection remain UI responsibilities.
- `ClockContext` is the single owner of workout/rest timers and their lifecycle. Do not add a second countdown in a screen hook.
- Native notifications/auth/networking use real Capacitor detection. Shared presentation must not grow a second legacy branch.

## Text and styling

Use `useLanguage().t` for the existing dictionary and `useCopy` with typed keys from `utils/interfaceCopy.ts` for modern interface copy. Keep all three translations together. Numbered placeholders must match across locales; tests enforce parity. Do not place EN/FR/AR ternaries in new UI components.

Use existing `--web-*` tokens and explicit roles inside shared surfaces:

| Class | Role |
| --- | --- |
| `surface-paper`, `surface-canvas` | Panel and page backgrounds |
| `surface-border` | Theme border |
| `surface-ink`, `surface-muted`, `surface-green` | Main, supporting and accent text |
| `surface-accent` | Filled accent control |
| `surface-flat`, `surface-rounded` | Flat shadow treatment and shared card radius |

These opt-in roles replace substring matching of Tailwind utility names. Some priority declarations remain to preserve existing utility-based screens; new components should avoid competing utility colors. Do not add `[class*="..."]` theme rules or fix a single component with global specificity escalation. Prefer its own class and state attributes.

## Verification and scope

Run `npm run check`, then relevant Playwright flows on Chromium and mobile WebKit. Exercise finish/reset/reload, saved routines, per-set data, theme/RTL/large text, modal keyboard behavior, touch input and page-scroll preservation where relevant. The unit suite includes rendered hook tests (`.test.tsx`).

Native asset checks, actual native compilation and physical-device acceptance are separate checks. A browser with a simulated Capacitor platform is not a native-device test. A GitHub push does not update an installed app.

Keep refactors incremental and behavior-preserving. Use explicit typed inputs rather than `any` or generic prop bags; avoid abstractions that merely move a large component elsewhere. Record verification limits and checkpoint each completed stage per `AGENTS.md`.
