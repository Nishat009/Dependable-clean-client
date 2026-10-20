# Agent notes

Dependable Clean is an npm workspace with two parts. Setup steps are in `HowToSetup.md`.

- `frontend/` – Next.js, React, TypeScript. App code is in `frontend/src/design/`. Read `frontend/AGENTS.md` first: this Next.js version differs from what you may know.
- `backend/` – Express and MongoDB. `index.js` holds the routes, `permissions.js` the role rules, `management.js` the support, profile and business routes, `schema.js` the collections and indexes, `seed.js` the demo data.

## Commands

- `npm install` – installs both workspaces.
- `npm run dev` – website on :3000, API on :5000.
- `npm test` – API and UI tests, no database needed.
- `npm run db:setup` – creates the collections and demo data.
- `npm run package` – ZIP of committed files only.

## Rules

- Every route that creates, updates or deletes data must use a role guard (`requireUser`, `requireCustomer`, `requireStaff`, `requireAdmin`, `requireSuperAdmin`, `requireTeamAdmin`). Public writes are only `/signup`, `/login`, `/demoLogin` and `/setupAccount`.
- Never commit `backend/.env` or real credentials. Add new settings to `backend/.env.example` with placeholders.
- Keep one lockfile, the root `package-lock.json`.
