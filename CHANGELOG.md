# Changelog

## 1.5.0 - 2026-11-06

Fixes for audit run #2035.

### Security
- Demo accounts have no fixed password. The API gives them a new random password on every start and they open only through `POST /demoLogin`; `/login` refuses them. The demo passwords were removed from `backend/auth.js`, the sign-in page and the docs, and older deployments have their old demo passwords replaced on the next start.
- The sign-in page shows the demo buttons only when the API reports `demoEnabled`. Demo sign-in stays off in production unless `DEMO_ACCOUNTS=on`.
- Production refuses to start when `AUTH_SECRET` is missing, shorter than 32 characters or an example value. `.env.example` leaves it empty and shows the command that generates one.
- Tokens carry a per-user version. Changing a password, switching an account off and the new `POST /logoutAll` revoke every earlier token; `requireUser` reloads the account and role on every request.
- `/signup`, `/login`, `/demoLogin` and `/setupAccount` are rate limited per IP address and email (`express-rate-limit`, `AUTH_RATE_LIMIT`).
- Request fields that start with `$` or contain a dot are rejected, and emails, passwords, statuses and ids are coerced to strings or ObjectIds, so MongoDB operators cannot be injected.
- Removed `express-fileupload`, which was mounted globally but not used. JSON and form bodies are capped at 100 KB.
- Lookups and updates by id put the owner, assignee or admin scope in the MongoDB filter.
- `docs/ROUTES.md` lists all 52 routes with their guards; a test fails if any write route lacks a guard or the file is out of date.
- New tests: route guard coverage, one customer cannot reach another customer's booking or ticket, operator injection, demo passwords, token revocation, rate limiting and the production `AUTH_SECRET` check.

### Database
- Migration `002-indexes-and-validators.js`: compound indexes (`book` email + createdAt and staffEmail + status, `message` conversationId + createdAt), lookup indexes (`book.serviceId`, `book.locationId`, `review.status`, `review.email`, `conversation.staffEmail`) and `$jsonSchema` validators on eight collections. `npm run db:schema` runs every migration in order.
- A service or service area that bookings use is archived instead of deleted.
- `schema.sql` and `seed.sql` are marked documentation only, and a test keeps `schema.sql` in step with the migrations.

### Structure
- `backend/index.js` only starts the API. Settings are in `config.js`, the app in `app.js`, the connection in `db.js`, guards in `middleware.js`, demo accounts in `demoAccounts.js`, and one router per area in `backend/routes/`. `management.js` was split into `routes/support.js` and `routes/business.js`.
- Frontend: `ManagementPages.tsx` split into one file per page; shared form validators in `validators.ts`; the route table moved from `CleaningApp.tsx` to `routes.tsx`.

### Dependencies and build
- All dependencies pinned to exact versions (`.npmrc` has `save-exact`); `engines` in every package and `.nvmrc` (Node 22).
- Updated `next` to 16.4.5 and `dotenv` to 17. Removed the unused `@grpc/grpc-js` override.
- `npm audit`: 0 vulnerabilities (before: 1 critical and 1 high in `next`, 1 moderate in `qs`, fixed with `npm audit fix`).
- `npm run build` builds both workspaces (the API is syntax-checked; it runs from source). Turbopack's root no longer depends on where `node_modules` was installed.
- Docs: README has the database setup step and the live API, HowToSetup names Node 20.13+ and MongoDB 6+ and uses `npm ci`, and `frontend/README.md` points to files that exist. `npm run check:live` checks the deployed demo for every role.

## 1.0.0 - 2026-10-20

### Added
- Role-based dashboard (owner, sub admin, staff, customer) for jobs, support chat, profile, business settings and activity log.
- Owner can add staff and sub admins and edit their access.
- Booking by service area with a date picker and a booking status workflow.
- Order reviews with owner approval.
- `backend/schema.js` creates every collection and index; `npm run db:setup` runs it and the demo seed.
- `database/` folder: `migrations/001-initial-schema.js` creates the database from scratch, with a collection and index reference in `database/README.md` plus `schema.sql` and `seed.sql`, a SQL copy of the same schema and demo data.
- `HowToSetup.md` with clean-machine setup steps, plus `AGENTS.md` and `CLAUDE.md` at the root.
- API and UI tests (`npm test`).

### Changed
- Frontend moved from Create React App to Next.js with TypeScript, in an npm workspace with the API.
- Demo sign-in only shows when `DEMO_ACCOUNTS` is on.
- Passwords need 12 or more characters.

### Security
- Every create, update and delete route needs a signed-in user with the right role.
- Removed a hardcoded MongoDB host and the `DB_USER`/`DB_PASS` fallback; the API now uses `MONGODB_URI` only.
- Updated `shell-quote` (critical advisory); `npm audit` reports 0 vulnerabilities.
- Dropped the redundant `backend/package-lock.json`; the root lockfile covers both workspaces.
