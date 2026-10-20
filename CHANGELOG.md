# Changelog

## 1.0.0 - 2026-10-20

### Added
- Role-based dashboard (owner, sub admin, staff, customer) for jobs, support chat, profile, business settings and activity log.
- Owner can add staff and sub admins and edit their access.
- Booking by service area with a date picker and a booking status workflow.
- Order reviews with owner approval.
- `backend/schema.js` creates every collection and index; `npm run db:setup` runs it and the demo seed.
- `database/` folder: `migrations/001-initial-schema.js` creates the database from scratch, with a collection and index reference in `database/README.md` and a `schema.sql` pointer note (the app uses MongoDB, not SQL).
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
