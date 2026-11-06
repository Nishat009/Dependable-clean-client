# Agent notes

Dependable Clean is an npm workspace with two parts. Setup steps are in `HowToSetup.md`.

- `frontend/` – Next.js, React, TypeScript. App code is in `frontend/src/design/`. Read `frontend/AGENTS.md` first: this Next.js version differs from what you may know.
- `backend/` – Express and MongoDB. `index.js` starts the API, `app.js` wires the routers in `routes/`, `middleware.js` holds the role guards, `permissions.js` the role rules, `config.js` the settings, `db.js` the connection. `docs/ROUTES.md` lists every route with its guard (`npm run docs:routes` regenerates it). Migrations are in `database/migrations/`, demo data in `backend/seed.js`.

## Commands

- `npm install` – installs both workspaces.
- `npm run dev` – website on :3000, API on :5000.
- `npm test` – API and UI tests, no database needed.
- `npm run build` – builds the website and syntax-checks the API.
- `npm run check:live` – checks the deployed demo for every role.
- `npm run db:setup` – creates the collections and demo data.
- `npm run package` – ZIP of committed files only.

## Rules

- Every route that creates, updates or deletes data must use a role guard (`requireUser`, `requireCustomer`, `requireStaff`, `requireAdmin`, `requireSuperAdmin`, `requireTeamAdmin`, `requireSupport`). Public writes are only `/signup`, `/login`, `/demoLogin` and `/setupAccount`, and they use the rate limiter. A test fails if a new write route has no guard or is missing from `docs/ROUTES.md`.
- Lookups by id must put the owner or assignee in the database filter, not check it afterwards.
- Never hard-code passwords, including demo ones. Demo accounts open only through `/demoLogin`.
- Never commit `backend/.env` or real credentials. Add new settings to `backend/.env.example` with placeholders.
- Keep one lockfile, the root `package-lock.json`.
