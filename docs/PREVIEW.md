# Optional hosted preview

Nothing has been deployed. Local development requires no hosting account.
The optional render.yaml defines a Django web service only. Keep temporary test
data backed up and replace this infrastructure before a public launch.

1. Create a temporary PostgreSQL database, for example Neon, and set DATABASE_URL
   with SSL required. Do not use SQLite on an ephemeral web-service filesystem.
2. Deploy Django using render.yaml. Set allowed hosts to the exact API hostname,
   FRONTEND_URL to your HTTPS frontend URL, and CORS_ALLOWED_ORIGINS to that
   frontend plus capacitor://localhost and https://localhost for native builds.
   Only set TRUST_PROXY behind the platform's trusted TLS proxy.
3. Build the frontend on a static host with VITE_API_URL=https://YOUR-API/api,
   `npm ci && npm run build`, output `dist`. Never expose server secrets through
   VITE_* variables. Serve sw.js and index.html with revalidation, hashed assets
   with immutable caching. Routes use URL hashes and need no server rewrites.
4. Configure ResendBackend with a server-side RESEND_API_KEY and an allowed sender.
   Real delivery to friends requires a verified sender/domain and provider
   permission. Provider test domains restrict recipients; acquiring a domain may
   cost money. SMTP is also supported on hosts where it is permitted.
5. Verify health, email verification/reset, two-device sync, conflicts, logout,
   account deletion and offline reload using disposable accounts. Do not put
   friends' real information into a preview until these checks succeed.

Render currently sleeps free services after inactivity, loses local files on
restart, and blocks common SMTP ports. Its free Postgres expires after 30 days.
See https://render.com/docs/free and recheck provider quotas before deploying.
The HTTPS email adapter avoids the SMTP restriction. Neon and email-provider free
plans have their own changing usage limits. No production availability is promised.

Before launch: use reliable paid compute and durable Postgres with tested backups
and restoration, review rate limits behind your real proxy, configure error/uptime
monitoring, set verified sender DNS, configure a real support contact/privacy URL,
and complete mobile store requirements in RELEASE.md. Do not advertise this
preview as a production service.
