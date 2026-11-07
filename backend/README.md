# API

Express 5.2.1 and the MongoDB Node.js driver 6.21.0 (pinned in `package.json`). Setup steps are in [HowToSetup.md](../HowToSetup.md); every route and its guard is in [docs/ROUTES.md](../docs/ROUTES.md).

## Layout

| File | Job |
| --- | --- |
| `index.js` | Starts the API: reads settings, opens the database, creates demo accounts when allowed, listens. |
| `config.js` | Every environment setting, checked once. Production refuses to start without a strong `AUTH_SECRET`. |
| `app.js` | Builds the Express app: body limits, CORS, operator-key rejection, guards, and the routers below. |
| `db.js` | MongoDB connection (or the in-memory preview in `demoDb.js`) and the unique indexes the API needs. |
| `middleware.js` | Role guards, rate limiting for sign-in, request sanitising and shared helpers. |
| `auth.js` | scrypt password hashing and HMAC-signed tokens with a per-user token version for revocation. |
| `permissions.js` | Roles, permissions and booking status transitions. |
| `validation.js` | Input checks and text normalising. |
| `demoAccounts.js` | The three demo accounts (random password on every start, opened only through `/demoLogin`). |
| `routes/accounts.js` | Sign up, sign in, demo sign-in, account setup, sign out everywhere. |
| `routes/locations.js`, `services.js`, `bookings.js`, `reviews.js`, `team.js`, `support.js`, `business.js` | One router per area. |
| `lib/dhakaThanas.js` | The Dhaka thana list, cached. |
| `schema.js`, `seed.js`, `setup-owner.js` | `npm run db:schema`, `npm run seed`, `npm run setup-owner`. |
| `scripts/` | Syntax check (`npm run build`) and the generator for `docs/ROUTES.md`. |
| `test/` | API tests: roles, ownership, workflows and security. |

## Commands

- `npm test` (from the root) – API and UI tests, no database needed.
- `npm run build` – syntax check of every backend file. The API runs from source; there is no compile step.
- `npm run docs:routes` – regenerate `docs/ROUTES.md` after adding or changing a route.
