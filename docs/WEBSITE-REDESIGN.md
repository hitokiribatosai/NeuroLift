# Website redesign review

## Saved baseline

- GitHub tag: `design-before-web-overhaul-2026-10-02`
- Baseline commit: `ba1ba3a`
- Review branch: `design/website-overhaul`

The tag is an annotated checkpoint of the previous design. The review branch does not replace `main`. Review the Vercel branch preview before merging; production stays on the old design while its production branch remains `main`.

## Scope

The browser receives a new responsive workspace, dashboard, onboarding and goal selection, plus a scoped visual system covering exercise browsing, training, journal, clock, nutrition, account, privacy, and settings. Existing data and authentication logic are reused. Demonstrations and research links are retained.

`Capacitor.isNativePlatform()` keeps Android and iOS on their previous screens. No native project or Capacitor configuration was changed or synced. Browser theme preference uses `neuroLift_web_theme`; native keeps `neuroLift_theme`. Both settings remain local to the current workspace, outside the synchronized data allowlist.

## Local review

### Refinement pass

1. Browser workout logging has a focused exercise editor, completed-set progress, previous performance, accessible weight/reps inputs, inline rest controls, and a finish confirmation. Native logging remains unchanged.
2. The browser journal starts with workouts and progress, with a separate measurements section; switching sections preserves the mounted form.
3. Small-screen navigation uses four primary destinations plus More for secondary tools.
4. The library has sticky search/filter controls, a selected-area summary, and separate demonstration/research labels. Missing images are explicitly identified.
5. Browser research wording uses Research-supported, explains direct versus related-movement training studies, and retains study links. This pass does not add studies or change their classifications.
6. Browser save/sync/offline feedback is inline. Website dialogs use focus trapping, Escape dismissal, and the new theme. Tests cover a saved session through reload and completion, measurement entry, mobile navigation, keyboard dismissal, and enlarged Arabic layout.

Local saves and server synchronization are distinct. The active session stays on the device; completed workout/account data follows the existing synchronization rules. This is not a comprehensive accessibility certification or physical-device validation.

Run `npm ci`, `npm run check`, then `npm run dev`. The browser interface is selected automatically. Exercise every route, change language and theme in settings, and check a saved workout in addition to the empty state. Run `npm run test:browser` after building (install Playwright Chromium if needed).

The browser suite covers responsive sections, onboarding, native runtime isolation, authentication, muscle selection, evidence links, RTL, and offline loading. Native runtime simulation is not a replacement for physical-device testing before a store release.

## Restore options

Before merging, simply continue using `main` or close the review PR: production never adopted the redesign.

To inspect the checkpoint without altering any existing work:

```sh
git fetch origin --tags
git worktree add ../NeuroLift-design-baseline design-before-web-overhaul-2026-10-02
```

After a future merge, revert the redesign commit(s) through a new branch and PR, then redeploy. Do not reset or force-push `main`, and do not overwrite unrelated later work. This is a code/design checkpoint, not a backup of users' workout data; export that separately from settings.
