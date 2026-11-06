# How to set up Dependable Clean

These steps take a clean machine to a running app. The project has two parts in one repository:

- `frontend/` – the website (Next.js, React, TypeScript)
- `backend/` – the API (Node.js, Express, MongoDB)

## 1. Install the tools

- **Node.js 20.13 or newer** (22 LTS recommended, pinned in `.nvmrc`) – https://nodejs.org. npm 10 or newer comes with it.
- **MongoDB 6.0 or newer** – either:
  - a free MongoDB Atlas cluster (https://www.mongodb.com/cloud/atlas), or
  - MongoDB Community Server installed locally (https://www.mongodb.com/try/download/community).

Check the versions:

```bash
node -v
npm -v
```

## 2. Restore packages

From the project folder (the one that has this file):

```bash
npm ci
```

This installs the exact package versions in the root `package-lock.json` for both the website and the API. (`npm install` also works, but `npm ci` is what CI and deployments should use.)

## 3. Configure the API

Copy the example settings file:

```bash
# macOS / Linux / Git Bash
cp backend/.env.example backend/.env
# Windows PowerShell
Copy-Item backend/.env.example backend/.env
```

Open `backend/.env` and set:

| Setting | What to put |
|---|---|
| `MONGODB_URI` | Your connection string, e.g. `mongodb://127.0.0.1:27017` for local MongoDB, or the Atlas `mongodb+srv://...` string |
| `DB_NAME` | Database name. Leave `houseCleaning` |
| `PORT` | API port. Leave `5000` |
| `CLIENT_ORIGIN` | Website address. Leave `http://localhost:3000` |
| `AUTH_SECRET` | A random string of 32+ characters. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. In production the API refuses to start without it. |

The other settings can stay as they are.

If you use Atlas, add your IP address under **Network Access** in Atlas. If you see `querySrv ECONNREFUSED`, also set `DNS_SERVERS=8.8.8.8,1.1.1.1`.

## 4. Configure the website

Copy the website settings file:

```bash
# macOS / Linux / Git Bash
cp frontend/.env.example frontend/.env.local
# Windows PowerShell
Copy-Item frontend/.env.example frontend/.env.local
```

`NEXT_PUBLIC_API_URL` is already `http://localhost:5000`. Change it only if the API runs somewhere else. (Without the file the website uses the same default.)

## 5. Create the database and add demo data

```bash
npm run db:setup
```

To create only the schema without demo data, run `npm run db:schema`. The complete MongoDB schema is the migrations in `database/migrations/` (001 creates the collections and indexes, 002 adds compound indexes and validators); see `database/README.md` for collection and index details. `database/schema.sql` and `database/seed.sql` hold the same schema and demo data as SQL for reference; `backend/seed.js` is the seed the app uses.

This runs two scripts in `backend/`:

1. `schema.js` – runs every migration: creates every collection, index and validator (`user`, `admin`, `service`, `location`, `book`, `review`, `conversation`, `message`, `activity`, `settings`).
2. `seed.js` – adds demo data: 6 services, 3 Dhaka service areas, 2 approved reviews and the demo owner role.

Both are safe to run again; they never duplicate or delete data.

## 6. Run the app

```bash
npm run dev
```

- Website: http://localhost:3000
- API: http://localhost:5000 (http://localhost:5000/health should answer `{"ok":true,...}`)

When the API starts in development, it creates the demo accounts used in step 7.

## 7. Sign in

Open http://localhost:3000/login and use one of the **Demo** buttons (Admin, Staff or Customer). Demo accounts have no fixed password: the API gives them a new random one on every start, and they open only through these buttons (`POST /demoLogin`). They exist only while `DEMO_ACCOUNTS` allows them.

Customers can also sign up with any email and a 12+ character password.

## 8. Check it works

```bash
npm test          # automated API and UI tests (no database needed)
npm run build     # production build of the website and a syntax check of the API
```

## Running without MongoDB

If `MONGODB_URI` is left empty, `npm run dev` still starts, using temporary in-memory demo data that is wiped on restart. Use this only for a quick look.

## Production

- API: deploy `backend/` (see `render.yaml`) with `npm ci`. Set `NODE_ENV=production`, `MONGODB_URI`, `CLIENT_ORIGIN` (the website URL) and a strong `AUTH_SECRET`. Leave `DEMO_ACCOUNTS` out for a real launch; set `DEMO_ACCOUNTS=on` only on a demo deployment with its own database and no real customer data.
- Run `npm run db:schema` against the production database once, and again after updating, to apply new migrations.
- Website: deploy `frontend/` (e.g. Vercel) with `NEXT_PUBLIC_API_URL` set to the API URL.
- Check the deployment with `npm run check:live` (set `LIVE_SITE_URL` and `LIVE_API_URL` for your own URLs). It signs in as each demo role and loads its dashboard.
- For a real owner account instead of the demo one, set `OWNER_EMAIL` and `OWNER_NAME` in `backend/.env` and run `npm run setup-owner`.

## Making the source ZIP

Commit your changes, then:

```bash
npm run package
```

This writes `dependable-clean.zip` from the committed files only, so `node_modules`, `.next`, `.env` and `.git` are never included.
