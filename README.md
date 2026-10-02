# NeuroLift

A workout tracker and exercise library for web/PWA, Android and iOS, with an
optional Django account service. Workouts, routines, journal and nutrition records
can sync across devices. Guest mode works without an account.

## Start locally — no paid hosting required

Use Node 24 and Python 3.13+. From this repository:

```sh
npm ci
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
backend/.venv/bin/python backend/manage.py migrate
backend/.venv/bin/python backend/manage.py runserver
```

In a second terminal: `npm run dev`, then open http://localhost:3000.
Verification and password-reset links appear in the Django terminal by default.
Windows commands and local Postgres/Mailpit are in [Development](docs/DEVELOPMENT.md).

## Included

- React 19, TypeScript, Vite and Capacitor 8.
- Django 5.2 LTS: hashed passwords, email verification, password reset, expiring
  bearer sessions, account deletion, version-checked account snapshots.
- Account-separated offline storage, export/import and explicit sync conflicts.
- Installable offline web app with versioned assets and no cached API responses.
- English, French and Arabic; revised training guidance and 168 licensed,
  locally bundled two-frame exercise demonstrations with reviewed mappings.
- Secure-by-default native configuration and cross-platform build preparation.

## Verify

```sh
npm run check
npx playwright install chromium
npm run test:browser
backend/.venv/bin/python backend/manage.py test api
npm audit
```

CI includes web checks, SQLite/Postgres tests, Android debug compilation and iOS
simulator compilation. CI must run on your repository before treating it as verified.

## Guides

- [Local development and data behavior](docs/DEVELOPMENT.md)
- [Android on Windows/macOS, iOS on macOS](docs/MOBILE.md)
- [Temporary preview hosting](docs/PREVIEW.md)
- [Training review and sources](docs/TRAINING.md)
- [Exercise media provenance](docs/MEDIA.md)
- [Release gates and known limitations](docs/RELEASE.md)
- [Implementation progress](IMPLEMENTATION.md)

This is a development baseline, not a claim of store approval or production
certification. Hosting, real email delivery, signing and store submission require
your own configuration. No ads, paid services or hosting accounts are provisioned.
Sessions end on reload; device caches are not encrypted by the app. Export backups
before moving between environments. Only a subset of the exercise library has
matching demonstrations; other exercises show an explicit unavailable state.
