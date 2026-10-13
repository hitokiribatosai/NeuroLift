# Temporary zero-cost preview: account setup needed

Website: https://myneurolift.vercel.app

**Status 2026-10-13:** provisioned. Preview API: https://neurolift-api-preview.onrender.com/api
(Vercel proxies `/api/*` to it via `vercel.json`). Read-only checks on 2026-10-13:
website 200 serving the `ea85753` bundle, `/api/health/` ok (~42 s cold start),
unauthenticated `/api/auth/me/` and `/api/snapshot/` return 401, CORS allows
`capacitor://localhost`. Signup/email/sync were not exercised by that check.
The original setup instructions below are kept for re-provisioning. The Render blueprint
includes this website's exact frontend URL and browser/native CORS origins.
Do not add card details, upgrade plans, or accept paid resources for this preview.
Stop if a provider requires billing and review an alternative.

## Accounts to create

1. Render: https://dashboard.render.com — choose the free workspace/service options.
2. Neon: https://console.neon.tech — create a Free project for the test PostgreSQL database.
3. Resend: https://resend.com — create a Free account with the email address you
   will use to test NeuroLift signup and password resets.

Use your own accounts. If connecting GitHub, limit repository access to NeuroLift
where the provider permits it. Do not paste API keys, passwords, or database URLs
into chat; enter them directly in the provider's secret/environment settings.

## Important email limitation

Without a domain you control, Resend's `onboarding@resend.dev` test sender can send
only to your Resend account's email address. This supports testing the same account
on the website and Android, not inviting friends. The `vercel.app` website URL is
not a domain whose email DNS you control. Never disable verification to work around
this restriction. Sending to friends requires a verified sender/domain or a
separately reviewed provider that permits your sender arrangement.

## Connect after account creation

- In Neon, obtain the PostgreSQL connection URL with TLS enabled. Put it directly
  in Render's secret `DATABASE_URL` field. Do not use Render's local SQLite storage.
- Deploy this repository's `render.yaml` using the Free web-service plan. Confirm
  the displayed cost is zero before submitting. Do not create Render Free Postgres:
  it expires after 30 days; this setup instead uses Neon.
- Set `DJANGO_ALLOWED_HOSTS` to the actual Render API hostname, without scheme/path.
- Keep `FRONTEND_URL=https://myneurolift.vercel.app` (no `#home`).
- Keep `CORS_ALLOWED_ORIGINS=https://myneurolift.vercel.app,capacitor://localhost,https://localhost`.
- Put the Resend sending key directly in `RESEND_API_KEY`. For owner-only testing,
  use `DEFAULT_FROM_EMAIL=NeuroLift <onboarding@resend.dev>`.
- Keep `DJANGO_DEBUG=false`; Render generates `DJANGO_SECRET_KEY`. `TRUST_PROXY`
  assumes deployment behind Render's trusted TLS proxy; do not reuse blindly elsewhere.
- Once `/api/health/` succeeds, set Vercel's `VITE_API_URL` to the actual HTTPS
  backend URL ending in `/api`, and redeploy the frontend.
- Rebuild Android/iOS with that same API URL. Existing APKs are not updated by
  changing Vercel or pushing code. Export local data before switching API environments.
- Test with a disposable account matching the Resend account address: signup,
  inbox verification, web and Android login, two-device sync, reset, logout, deletion.

Render Free sleeps after inactivity, so cold starts can be slow (~42 s observed
2026-10-13). The client's request timeout is 90 seconds (`utils/authService.ts`);
if wake-up still exceeds it, wait and retry.
Do not blindly auto-retry mutating account requests. No production uptime or
durability guarantee is claimed. Stay within each Free plan's quotas.

## Sources checked 2026-10-04

- Render limits: https://render.com/docs/free
- Neon Free plan: https://neon.com/blog/neon-free-plan-1-gb-per-project
- Resend test-sender restrictions: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain

Steps 2–6 of the release plan remain pending; no public launch or store submission
has been performed.
