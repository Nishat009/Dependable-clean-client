# Dependable Clean

This is the combined Dependable Clean repository. It contains the Next.js app in `frontend/` and the Express API in `backend/`. The redesigned frontend lives in `frontend/src/design`; the previous UI is retained under `frontend/src/legacy` for reference.

## Run both applications

From this folder, run `npm install` once and then `npm run dev`. The frontend runs at http://localhost:3000 and the Express API runs at http://localhost:5000.

For a local preview, no database setup is needed. The API serves sample services and stores bookings, reviews, and admin edits in memory until the server restarts. On the sign-in page, use the local customer or admin preview buttons. To use MongoDB, copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` or the listed credentials. You can optionally set `DB_NAME`, `PORT`, and `CLIENT_ORIGIN`.

Run `npm run build` to build the frontend, then `npm run start` to start both production processes.

The frontend uses Next.js 16, React 19, and Redux Toolkit. The API uses Express 5 and MongoDB Node driver 6. Node.js 20.13 or newer is required.
