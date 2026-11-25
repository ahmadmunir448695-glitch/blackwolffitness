# Championship portal

Online Taekwondo championship management and registration, built into the website under `/portal` (menu item **Championships**).

```
Website (Vue, src/portal)  ──HTTPS + Bearer token──►  API (separate service)  ──►  SQLite + uploads folder
```

> **The backend (`server/`) has been removed from this repository.** The portal pages in `src/portal/` remain, but they need an API that implements the endpoints below; until one is connected, the portal cannot sign in or load data. The original implementation is in git history (commit `167d103`).

The website deploys as a static site; the API runs as a separate service.

## Run locally

```bash
npm install
npm run dev       # website; /api is proxied to an API on localhost:8787
```

Open http://localhost:5173/portal.

## Roles

| Role | Can do |
|---|---|
| Super Admin | Everything: all championships, users, organizers, audit log |
| Event Organizer | Create championships; manage only championships they created or were assigned to; review entries, payments, reports for those |
| Club Manager | Signs up publicly. Manages their club: teams, athletes, coaches, coach/athlete logins, entries, payments |
| Coach | Login created by the club manager. Adds/edits athletes and registers entries; cannot delete teams/athletes or manage coaches |
| Athlete (optional) | Login created by the club manager. Read-only: own entries, documents, events |

Clubs only ever see their own data (other clubs' records answer 404). Every rule is enforced by the API, not just hidden in the UI.

## Features

- **Events**: listing with status (Upcoming, Registration Open/Closed, Ongoing, Completed — computed from dates, with manual override), details page with description, rules, schedule, venue, age/weight/belt groups, categories, fees, announcements, invitation and rules PDFs.
- **Admin event setup**: everything is per championship — age groups, weight ladders (bulk "45, 48, 51…"), belt groups, categories for Kyorugi, Poomsae (individual/pair/team, recognized/freestyle), Breaking (speed/power/technical) and Team Demonstration (configurable team size), per-category fee, entry limits, document requirements, age rule (birth year or exact date), weight tolerance, duplicate-entry rule, max categories per athlete. "Generate categories" creates all gender × age × belt combinations; "Copy setup" reuses another championship's configuration.
- **Registration wizard** (8 steps): championship → team → athletes (or add new) → details → categories (only eligible ones shown, weight class suggested) → documents → review (server eligibility check) → submit or save draft → confirmation with registration IDs and PDFs.
- **Server-side checks**: registration window, team ownership, gender/age/belt/weight eligibility, pair/team size, duplicate athlete in the same event + category (unless allowed), per-athlete category limit, per-team category quota, required documents before submission.
- **My Entries**: filters, sorting, pagination; entry page with edit (before deadline or when a correction is requested), resubmit, cancel, delete draft, confirmation PDF, payment reporting with receipt upload.
- **Review**: statuses Draft → Submitted → Under Review → Approved / Rejected / Correction Required; Cancelled by the club. Bulk review. Notes are sent to the club.
- **Payments**: clubs report payments (with receipt); organizers confirm/reject, or record cash, waive or refund.
- **Reports**: CSV (Excel-ready, UTF-8 BOM, formula-injection safe) for entries, athletes, teams, categories; printable category-wise list grouped by weight class.
- **Notifications** (in-app) for submissions, decisions, payments, announcements. **Audit log** of important actions.
- **Uploads**: JPG/PNG/WEBP/PDF only, size-limited, content checked against the file type, random file names. Athlete photos and documents are private and served only through permission checks.

## Database (removed implementation, for reference)

SQLite (Node's built-in `node:sqlite`). Migrations live in `server/migrations/` and run automatically on start (`npm --prefix server run migrate` runs them by hand).

Tables: `users`, `clubs`, `teams`, `coaches`, `athletes`, `events`, `event_organizers`, `age_divisions`, `weight_divisions`, `belt_divisions`, `event_categories`, `announcements`, `registrations`, `registration_athletes` (members + weight/belt snapshot at submission), `documents`, `payments`, `notifications`, `audit_logs`.

## API endpoints (all under `/api`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/signup`, `POST /auth/login`, `GET/PATCH /auth/me`, `POST /auth/change-password`, `POST /auth/logout-all` |
| Public | `GET /meta`, `GET /events`, `GET /events/:idOrSlug`, `GET /files/:name`, `GET /health` |
| Club | `GET/PATCH /club`, `GET /dashboard` |
| Teams | `GET/POST /teams`, `GET/PATCH/DELETE /teams/:id`, `POST /teams/:id/logo` |
| Athletes | `GET/POST /athletes`, `GET /athletes/me`, `GET/PATCH/DELETE /athletes/:id`, `POST/GET /athletes/:id/photo`, `POST /athletes/:id/documents`, `POST /athletes/:id/account` |
| Coaches | `GET/POST /coaches`, `PATCH/DELETE /coaches/:id`, `POST /coaches/:id/account`, `POST /coaches/:id/account/status` |
| Registrations | `GET/POST /registrations`, `POST /registrations/check`, `GET/PATCH/DELETE /registrations/:id`, `POST /registrations/:id/submit`, `POST /registrations/:id/cancel`, `GET /registrations/:id/confirmation.pdf`, `POST /registrations/:id/payments`, `POST /registrations/:id/documents` |
| Documents | `GET /documents`, `GET /documents/:id/download`, `DELETE /documents/:id` |
| Notifications | `GET /notifications`, `POST /notifications/read-all`, `POST /notifications/:id/read`, `DELETE /notifications/:id` |
| Admin events | `GET/POST /admin/events`, `GET/PATCH/DELETE /admin/events/:id`, `POST …/publish`, `POST …/status`, `POST/DELETE …/files/:kind`, CRUD `…/age-divisions`, `…/weight-divisions` (+ `/bulk`), `…/belt-divisions`, `…/categories` (+ `/generate`), `POST …/copy-config`, `POST/DELETE …/announcements`, `PUT …/organizers` |
| Admin | `GET /admin/stats`, `GET /admin/registrations`, `GET /admin/registrations/:id`, `POST /admin/registrations/:id/review`, `POST /admin/registrations/bulk-review`, `POST /admin/registrations/:id/payment`, `GET /admin/payments`, `POST /admin/payments/:id`, `GET /admin/teams`, `GET /admin/athletes`, `GET /admin/clubs`, `GET /admin/reports/categories`, `GET /admin/reports/{entries,athletes,teams,categories}.csv`, `GET/POST/PATCH /admin/users`, `GET /admin/audit` |

## Deploying an API (removed implementation, for reference)

The API needs a Node 22.13+ host with a **persistent disk** (SQLite file and uploads), e.g. Render (web service + disk), Railway, Fly.io or a VPS.

1. Create the service from this repo with root directory `server`, build `npm install`, start `npm start`.
2. Mount a disk (e.g. `/var/data`) and set the variables from `server/.env.example`: `SESSION_SECRET`, `CORS_ORIGINS` (the website URL), `DATABASE_PATH`, `STORAGE_DIR`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `TRUST_PROXY=1`.
3. On the website host (Netlify/Vercel), set `VITE_PORTAL_API_URL=https://<your-api-host>/api` and redeploy.
4. Sign in with the admin account, change its password, create organizer accounts, and create the first championship.

Back up the database file and uploads folder regularly.

## Tests

```bash
npm test                   # website
```

## Not included yet

- **Email/SMS notifications**: notifications are in-app only. Hook an email provider into `server/src/lib/notify.js` to send them as well.
- **Online card payments**: payments are reported by clubs and confirmed by organizers. A payment gateway can be added later.
- **Password reset by email**: a super admin can reset any password from Admin → Users; club managers reset coach/athlete logins by recreating them.
