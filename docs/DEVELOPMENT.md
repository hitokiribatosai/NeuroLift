# Develop locally

Use Node 24.15+ (24 LTS recommended) and Python 3.13 or 3.14. No paid service is needed.
The frontend is at http://localhost:3000 and Django at http://localhost:8000/api.
Session tokens remain in memory; closing/reloading the app requires another login
for sync. Offline cached data remains available on that device.

## macOS quick start

From the repository root:

```sh
npm ci
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
backend/.venv/bin/python backend/manage.py migrate
backend/.venv/bin/python backend/manage.py runserver
```

In another terminal run `npm run dev`. The sample backend environment prints
verification/reset email links in the backend terminal. Open the link, explicitly
confirm verification, then sign in. No real email is sent in this mode.

## Windows PowerShell

```powershell
npm ci
py -3.13 -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
backend/.venv/Scripts/python backend/manage.py migrate
backend/.venv/Scripts/python backend/manage.py runserver
```

Run `npm run dev` in a second terminal. You do not need to activate the virtual
environment when using these explicit interpreter paths.

## Local Postgres and Mailpit

With Docker Desktop installed, run `docker compose up --build`, then run
`npm ci` and `npm run dev` on the host. Mailpit is at http://localhost:8025.
Docker captures account emails locally; it does not deliver to actual inboxes.
The database uses a named volume. `docker compose down` preserves that volume.
These credentials and the development server are for local use only.

For a separately installed Mailpit, change backend/.env to
`EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`, port 1025.
Restart Django after changing environment settings.

## Accounts, guest data and conflicts

Guest data is separate from every account. To transfer existing guest records,
export in Settings, sign in, then import the backup in Settings. Imports validate
the full file before an atomic write. Matching collection categories are replaced,
not silently merged. Export first if both contain records you want to retain.

Account data includes completed workouts, templates, journal, calorie records and
profile/goals. Theme, language, clocks and active workout drafts stay on each device.
Edits queue locally and sync after a short delay while signed in; reopening Account
or pressing Sync now also pulls the newest server data. No real-time push is claimed.

The server uses one versioned snapshot per account. Simultaneous device edits
produce an explicit conflict. The user chooses local or server data; the overwritten
version is retained as `neuroLift_conflict_backup_<id>` or
`neuroLift_remote_backup_<id>` in localStorage. A fresh conflict requires a fresh
choice. Export first; this preview is not a record-by-record merge engine.

Browser storage is not encrypted by this app. Use a trusted device and device lock.
Sign out before changing accounts. Account deletion removes that account's server
records and this device's account cache; other offline devices may retain copies.
The preview caps snapshots at 1.5 MB / collections at 5,000 records.

## Checks

`npm run check` runs frontend quality checks. Backend:
`backend/.venv/bin/python backend/manage.py test api` (use the Windows path above
on Windows). Schedule `python manage.py cleanup_expired` periodically on a hosted
service to prune expired tokens and rate-limit records.

For Android and iOS setup see [MOBILE.md](MOBILE.md).
