# How to set up Dependable Clean

These steps take a clean machine to a running app. The project has two parts in one repository:

- `frontend/` – the website (Next.js, React, TypeScript)
- `backend/` – the API (Node.js, Express, MongoDB)

## 1. Install the tools

- **Node.js 20.13 or newer** (22 LTS recommended) – https://nodejs.org. npm comes with it.
- **MongoDB** – either:
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
npm install
```

This installs the packages for both the website and the API.

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
| `AUTH_SECRET` | Any long random string (32+ characters) |

The other settings can stay as they are.

If you use Atlas, add your IP address under **Network Access** in Atlas. If you see `querySrv ECONNREFUSED`, also set `DNS_SERVERS=8.8.8.8,1.1.1.1`.

## 4. Configure the website (optional)

The website calls the API at `http://localhost:5000` by default, so nothing is needed locally. To point it somewhere else:

```bash
cp frontend/.env.example frontend/.env.local
```

and change `NEXT_PUBLIC_API_URL`.

## 5. Create the database and add demo data

```bash
npm run db:setup
```

To create only the schema without demo data, run `npm run db:schema`. The complete MongoDB schema is in `database/migrations/001-initial-schema.js`; see `database/README.md` for collection and index details.

This runs two scripts in `backend/`:

1. `schema.js` – creates every collection and index (`user`, `admin`, `service`, `location`, `book`, `review`, `conversation`, `message`, `activity`, `settings`).
2. `seed.js` – adds demo data: 6 services, 3 Dhaka service areas, 2 approved reviews and the demo owner role.

Both are safe to run again; they never duplicate or delete data.

## 6. Run the app

```bash
npm run dev
```

- Website: http://localhost:3000
- API: http://localhost:5000 (http://localhost:5000/health should answer `{"ok":true,...}`)

When the API starts, it creates the demo accounts below.

## 7. Sign in

Open http://localhost:3000/login and use a **Demo** button, or type one of these:

| Role | Email | Password |
|---|---|---|
| Owner (super admin) | `admin@dependableclean.demo` | `demo-admin-123` |
| Staff | `staff@dependableclean.demo` | `demo-staff-123` |
| Customer | `customer@dependableclean.demo` | `demo-customer-123` |

Customers can also sign up with any email and a 12+ character password.

## 8. Check it works

```bash
npm test          # automated API and UI tests (no database needed)
npm run build     # production build of the website
```

## Running without MongoDB

If `MONGODB_URI` is left empty, `npm run dev` still starts, using temporary in-memory demo data that is wiped on restart. Use this only for a quick look.

## Production

- API: deploy `backend/` (see `render.yaml`). Set `NODE_ENV=production`, `MONGODB_URI`, `CLIENT_ORIGIN` (the website URL) and `AUTH_SECRET`. Set `DEMO_ACCOUNTS=on` to keep the demo sign-in, or leave it out for a real launch.
- Website: deploy `frontend/` (e.g. Vercel) with `NEXT_PUBLIC_API_URL` set to the API URL.
- For a real owner account instead of the demo one, set `OWNER_EMAIL` and `OWNER_NAME` in `backend/.env` and run `npm run setup-owner --workspace @dependable-clean/server`.

## Making the source ZIP

Commit your changes, then:

```bash
npm run package
```

This writes `dependable-clean.zip` from the committed files only, so `node_modules`, `.next`, `.env` and `.git` are never included.
