# Release gate — not a store-ready certification

This implementation is a local-development baseline. Do not publish until the
following owner-controlled gates pass. CI definitions are included, but a local
pass does not prove those remote jobs or native device tests passed.

## Data and accounts

- Configure your own HTTPS API, durable Postgres, exact frontend/native origins,
  strong Django secret and verified sender. Never put secrets in VITE_ variables.
- Disable debug, validate reverse-proxy trust and run Django check --deploy.
  Review per-IP throttling behind your chosen proxy; do not trust arbitrary
  X-Forwarded-For values. Add edge rate limiting for a public service.
- Test verification/reset with real delivery, replay, expiry and failed delivery.
- Test account A/B isolation, two devices, offline edits, conflict choices, logout,
  deletion and export/restore. Sessions intentionally end on reload.
- Configure monitored database backups and perform a restore rehearsal.
  Deletion of live records does not immediately erase retained backups or copies
  on other offline devices. Set and disclose actual retention rules.
- Arrange monitoring, cleanup_expired, incident contact and dependency updates.
  This snapshot sync has a 1.5 MB cap and is not a real-time merge engine.
- Export local data before changing API environments or browser origins. Numeric
  account IDs are local to each backend; use separate app/origin builds for
  production and preview, never point an existing production cache at a new DB.

## Native and store testing

- Follow MOBILE.md. Build unsigned/debug first, then signed release with your own
  identity and HTTPS API. Never commit keystores, signing passwords or certificates.
- Test on Android and iOS hardware: timer backgrounding, notifications denied and
  allowed, screen lock, sharing backups, safe-area layout, keyboard, font scaling,
  offline recovery, account deletion and deep links.
- Verification links currently open the web account page. Universal/App Links
  and persistent native secure-storage sessions are future enhancements.
- Verify App ID ownership, version/build increments, icons/splash screens,
  launch performance, supported OS versions and device screenshots.
- Publish genuine support/contact and privacy URLs. Review privacy copy, native
  manifest, App Store privacy and Play data/health declarations against the actual
  deployed providers and data practices. No advertising SDK is integrated.
- Ads/consent, billing, production hosting and store submissions are separate
  work. Temporary free infrastructure is not a reliability guarantee.

## Content and usability

- Visually review every bundled demonstration with a qualified exercise reviewer;
  provenance/checksum tests cannot assess technique or performer rights.
  Currently 168 distinct library exercise names have two-frame demonstrations
  with reviewed source mappings. Some illustrations are CC BY-SA 4.0; keep
  Workout Guide and Everkinetic attribution with the app and released assets.
- Keep the no-media fallback for the remaining library. Do not substitute a
  different exercise merely to fill the space.
- Validate EN/FR/AR copy, RTL layout, screen-reader names, large fonts and contrast.
  Some operational account/error/status messages remain English.
- General training guidance is not an individualized prescription. Avoid medical
  or guaranteed-result claims. Add professionally reviewed programs separately.

## Security maintenance

The unused asset generator was removed. The Xcode parser's UUID dependency is
overridden to 11.x: its only call is the compatible v4() API; native sync and
project parsing are checked. Remove the override when the upstream package fixes
its constraint. npm audit is a point-in-time advisory check, not a security audit.
