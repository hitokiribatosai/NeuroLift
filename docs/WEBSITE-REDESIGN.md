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
