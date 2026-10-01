# Approved implementation

Work proceeds in this order. Local development comes first; publishing and
advertising are separate future work. No production services are provisioned.

- [x] 1. Remove coaching placeholder, generated testimonials and misleading branding.
- [x] 2. Correct training guidance, research claims and progress metrics.
- [x] 3. Correct exercise media mappings and bundle licensed demonstrations.
- [x] 4. Replace legacy backend with Django authentication and account data sync.
- [x] 5. Document local development and temporary preview hosting.
- [x] 6. Repair offline PWA support.
- [x] 7. Harden mobile configuration and native build reproducibility.
- [x] 8. Quality checks, focused tests, release documentation and design polish.

Validation and environment limitations are recorded here as the steps finish.

Steps 1–2: web build passes. Typecheck currently reports only the pre-existing
missing authService imports, addressed by step 4. Unused testimonial content
was removed; the original remains recoverable from Git history.

Step 3: bundled 41 exact exercise demonstrations (82 photographs) with pinned
provenance, checksums and license. Other exercises explicitly show no matching
demo. Removed misleading substitute-image mappings. Web build passes.

Step 4: Django 5.2 LTS, eight backend integration tests passing (registration,
verification, reset/replay protection, session revocation/expiry, account
deletion, account isolation, conflict prevention, validation and throttling).
Frontend typecheck and build pass. Data is consolidated into atomic, account-
scoped local workspaces; older local data is retained and migrated as guest.
Guest data is imported into an account only through explicit backup/restore.
Browser/native sessions use expiring bearer tokens held in memory, requiring
sign-in after restart; cached account data remains available offline.

Step 5: local Python setup and health endpoint verified. Added Windows/macOS
instructions, Docker Compose for Postgres/Mailpit and optional Render API config.
Docker is not installed here, so the Compose path is not executed locally.
Hosted services and real email delivery require user-owned credentials; none
were provisioned. SMTP and an optional Resend HTTPS transport are supported.

Step 6: production build generates a content-versioned service worker and
install manifest. Chromium test confirms offline reload and bundled media,
with no API responses in Cache Storage. Native apps skip service workers.

Step 7: debug web assets build and sync for both platforms; iOS plist/project
syntax validates and release guard rejects debug assets. Native compilation
is unverified here: Java/Android SDK and full Xcode are not installed.

Step 8: npm run check passes (TypeScript with React declarations, ESLint,
13 unit tests, production build). Eight Django integration tests and six
Chromium browser tests pass. Django deployment checks and migration drift
checks pass. npm audit and pip-audit report zero known vulnerabilities at
verification time. Mobile dark-mode and Arabic light-mode screenshots reviewed.
Android/iOS debug builds and Capacitor sync rerun after dependency updates;
native project/plist/shared-scheme syntax validates. CI added for web, backend
SQLite/Postgres and native debug compilation, but remote CI has not been run.

Fixed cross-tab account scoping, JSON-order sync refresh loops, backup export
error handling, decimal workout weights, negative set values, mobile navigation
width and missing translations. Dialogs now trap keyboard focus and close with
Escape; workout rest duration is adjustable. Removed unused vulnerable tooling,
updated dependencies, split the web bundle, and documented release gates.

Not verified/provisioned: full Android/iOS compilation, real-device behavior,
Docker/Postgres execution, real email delivery, hosted preview, signing, store
submission, universal links, or a professional exercise-technique review.
No external accounts, paid services, ads or deployments were created.
Original removed files remain recoverable in Git history. The legacy Firebase
.env is no longer tracked; local configuration stays outside version control.
