# Dependable Clean

This is the combined Dependable Clean repository. It contains the Next.js app in `frontend/` and the Express API in `backend/`. The redesigned frontend lives in `frontend/src/design`; the previous UI is retained under `frontend/src/legacy` for reference.

## Run both applications

From this folder, run `npm install` once and then `npm run dev`. The frontend runs at http://localhost:3000 and the Express API runs at http://localhost:5000.

For a local preview, no database setup is needed. The API serves sample services and stores bookings, reviews, and admin edits in memory until the server restarts. On the sign-in page, use the **Demo customer** or **Demo admin** button. To use MongoDB, copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`. You can optionally set `DB_NAME`, `PORT`, and `CLIENT_ORIGIN`. If the connection fails with `querySrv ECONNREFUSED`, set `DNS_SERVERS=8.8.8.8,1.1.1.1`. To add the sample services, reviews, and the `admin@dependableclean.demo` admin to the database, run `npm run seed --workspace @dependable-clean/server`. Running it again does not add duplicates.

People create an account with their name, email address and a password, then sign in with the email and password. The API stores passwords as scrypt hashes and returns a signed token that lasts seven days. Booking, reviews and the bookings list need a signed-in user, and the order, service and admin tools need an admin. A user is an admin when their email address is in the `admin` collection, so an admin can promote someone from **Add admin**.

The API creates two demo accounts when it starts: `customer@dependableclean.demo` and `admin@dependableclean.demo`. The demo buttons on the sign-in page use them. Anyone can use them, so set `DEMO_ACCOUNTS=off` when the site is for real customers.

## How the site works

- **Reviews**: a customer's review is saved as Pending. Admins approve or reject it under **Reviews**, and only approved reviews appear on the home page. Customers see the status of their own reviews on **Write a review**.
- **Team**: on **Team**, an admin adds a teammate by email. Someone new also needs a name and a temporary password, which creates their account so they can sign in straight away. Someone who already has an account only needs the email.
- **Bookings**: the date must be at least 3 days from today. The form and the API both check this.
- **Locations**: admins add, edit and remove the areas they serve under **Locations**. When any exist, customers choose one when booking. Each service covers every location unless the admin ticks specific ones on the service form.
- **Services**: admins add and edit services, including what is included, team size, who it is ideal for and whether supplies are included. Run the seed again to add these details to the sample services already in your database.
- Every successful API response is a 200 with a JSON body. Errors use 4xx or 5xx with `{ "error": "…" }`.

The frontend is written in TypeScript. Screens live in `frontend/src/design/screens`, shared components in `frontend/src/design/components`, and API types in `frontend/src/design/types.ts`.

Run `npm run build` to build the frontend, then `npm run start` to start both production processes.

## Deploy the API to Render

`render.yaml` describes the API as a Render web service. In the Render dashboard, choose **New → Blueprint** and select this repository. Render asks for two values and generates `AUTH_SECRET`, which signs sign-in tokens:

- `MONGODB_URI`: the connection string for your MongoDB Atlas cluster. In Atlas, open **Network Access** and add `0.0.0.0/0`, because Render does not use fixed IP addresses. Without it the deploy fails with `tlsv1 alert internal error ... SSL alert number 80`.
- `CLIENT_ORIGIN`: the URL where the frontend is hosted, for example `https://dependable-clean.vercel.app`.

When the deploy finishes, `https://<service>.onrender.com/health` should return `"mode":"database"`. Set `NEXT_PUBLIC_API_URL` to the service URL wherever the frontend is built, then rebuild the frontend. On the free plan the service sleeps after 15 minutes without traffic, so the first request after a pause can take about 30 seconds.

The frontend uses Next.js 16, React 19, and Redux Toolkit. The API uses Express 5 and MongoDB Node driver 6. Node.js 20.13 or newer is required.
