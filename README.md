# Dependable Clean

This is the combined Dependable Clean repository. It contains the Next.js app in `frontend/` and the Express API in `backend/`. The redesigned frontend lives in `frontend/src/design`; the previous UI is retained under `frontend/src/legacy` for reference.

## Run both applications

From this folder, run `npm install` once and then `npm run dev`. The frontend runs at http://localhost:3000 and the Express API runs at http://localhost:5000.

For a local preview, no database setup is needed. The API serves sample services and stores bookings, reviews, and admin edits in memory until the server restarts. On the sign-in page, use the local customer or admin preview buttons. To use MongoDB, copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`. You can optionally set `DB_NAME`, `PORT`, and `CLIENT_ORIGIN`. If the connection fails with `querySrv ECONNREFUSED`, set `DNS_SERVERS=8.8.8.8,1.1.1.1`. To add the sample services, reviews, and the `admin@dependableclean.demo` admin to the database, run `npm run seed --workspace @dependable-clean/server`. Running it again does not add duplicates.

Sign-in asks only for a name and email address and keeps them in the browser. There is no password, so anyone who enters an admin's email address can use the admin tools.

Run `npm run build` to build the frontend, then `npm run start` to start both production processes.

## Deploy the API to Render

`render.yaml` describes the API as a Render web service. In the Render dashboard, choose **New → Blueprint** and select this repository. Render asks for two values:

- `MONGODB_URI`: the connection string for your MongoDB Atlas cluster. In Atlas, allow access from `0.0.0.0/0`, because Render does not use fixed IP addresses.
- `CLIENT_ORIGIN`: the URL where the frontend is hosted, for example `https://dependable-clean.vercel.app`.

When the deploy finishes, `https://<service>.onrender.com/health` should return `"mode":"database"`. Set `NEXT_PUBLIC_API_URL` to the service URL wherever the frontend is built, then rebuild the frontend. On the free plan the service sleeps after 15 minutes without traffic, so the first request after a pause can take about 30 seconds.

The frontend uses Next.js 16, React 19, and Redux Toolkit. The API uses Express 5 and MongoDB Node driver 6. Node.js 20.13 or newer is required.
