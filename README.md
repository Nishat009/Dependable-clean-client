# Dependable Clean

A single-business cleaning management app using the existing Next.js/React frontend and Express/MongoDB API.

## Run locally

Run `npm install`, then `npm run dev` from the repository root. Frontend: http://localhost:3000. API: http://localhost:5000.

Without MongoDB, development uses an **in-memory preview**. It resets on restart; use test data only. Demo Staff, Customer and Admin buttons are available in local development, with either preview storage or MongoDB. Set `DEMO_ACCOUNTS=off` to disable them. Production mode never enables demo sign-in, and previously created demo users are blocked there. Use a development database when testing demo accounts; demo actions affect the configured development data.

For persistent data, copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`, `DB_NAME`, `CLIENT_ORIGIN` and a strong `AUTH_SECRET`. Production requires MongoDB. Set `NEXT_PUBLIC_API_URL` in the frontend environment to the API origin, then rebuild. Keep frontend and API on HTTPS in production.

## Owner setup and business configuration

Set `OWNER_EMAIL` and `OWNER_NAME` in the backend environment, then run `npm run setup-owner --workspace @dependable-clean/server`. This prints a private, single-use setup link, valid for 24 hours. Open it to choose your password. The command refuses to reset an existing configured account or replace an existing real owner. It can retire the old seeded demo owner without deleting its records. Existing real owners can continue using their existing credentials.

`BUSINESS_TIMEZONE` (default `Asia/Dhaka`) and `BUSINESS_CURRENCY` (default `BDT`) are configured on the **API**; the frontend loads both from `/business`. Confirm the currency of existing service prices before launch; changing the setting does not convert stored amounts. Prices are snapshots in the configured business currency; do not change currency after live bookings without a deliberate data migration.

From the owner's dashboard:

- Add supported service areas before accepting requests, and configure services, prices, scope and active status.
- Add actual contact details, FAQ, cancellation policy and current offer terms under **Business content**. These appear publicly in the footer. Empty content stays unpublished; no contact details or discounts are invented. Offer terms are informational; each service's configured price is the booking price.
- Invite staff under **Team** and privately share the generated setup link. Staff choose their own passwords; no temporary passwords are shown or stored. Existing accounts retain their current password unless they use the setup link. Invitations expire after 24 hours. Create another invitation to replace an expired link.
- Review booking requests, confirm them, then assign active staff. Approve a requested reschedule or cancel a booking as appropriate. Mark a request handled to dismiss a rejected request; use support to explain the decision.

`BUSINESS_EMAIL` and `BUSINESS_PHONE` provide initial contact defaults, until the owner saves Business content. Do not run the demo seed against a live business database: it contains sample services and reviews. Existing records are preserved; old booking status labels are normalized when read. Old bookings retain their stored name and price; scope cannot be reconstructed reliably for bookings created before snapshots existed.

## Roles and workflows

All roles share the dashboard shell and land on `/dashboard` after login. Legacy screen URLs remain available for existing links.

- `super_admin`: services/pricing, published offer terms, service areas, team access, all bookings and assignments, review moderation, private customer support, reports and activity.
- `staff`: active service/area information, their assigned jobs and schedule, permitted job status updates and internal notes, own profile.
- `customer`: cleaning requests, own booking details/history, cancellation/reschedule requests, one review per completed booking, private owner support and own profile.

Backend checks use the current database account and role on every protected request. Role and ownership cannot be chosen by sending a customer ID or a role in a request. Deactivated staff immediately lose API access, including existing tokens; their staff record and assigned-job history stay intact. Staff cannot access support, moderation, reports, team administration, or unassigned jobs.

Bookings follow `requested → confirmed → assigned → in_progress → completed`, with cancellation before work begins. Staff may move only their assigned jobs from `assigned` to `in_progress`, then `completed`. Requests require a real date at least three business-calendar days ahead, a supported area with a matching thana, and an address. Service name, price and scope are copied into the booking. A request is not confirmed until the owner confirms it. Internal notes are omitted from customer API responses.

Support messages persist in MongoDB. Polling runs every 10 seconds, with unread counts, per-message read state, timestamps and open/resolved status. Sending is limited to 10 messages per account per minute in this single-server deployment. No additional infrastructure is required.

Reviews start pending and require the submitting customer's completed booking. A unique booking-review index prevents duplicate reviews. Only approved reviews are public. The owner can approve, reject or hide them. Legacy reviews without a status retain their previous published behavior.

Reports distinguish **booking value** from **recorded payments**. This app does not implement payment collection; booking value is never labeled revenue. Activity records track staff access changes, booking updates/assignments, service/area changes, business content and review moderation.

Management lists provide search/filter controls and client-side pagination, appropriate to a small business.

## Verification

- `npm test`: API integration and rendered-component tests.
- `npm run build`: frontend production build and TypeScript checking.
- `npm run build --workspace @dependable-clean/server`: backend syntax checks.

API tests launch an isolated preview server and exercise direct HTTP requests: all roles' management restrictions, ownership, invalid booking input, status transitions, assignments, rescheduling, internal-note privacy, review eligibility/moderation, support privacy/read counts/rate limits, profile privilege escalation attempts, setup-link reuse and deactivated staff tokens. Component tests verify role navigation, exact sidebar selection and `/dashboard` login redirects. These tests do not connect to your production database or send invitations/messages to real people.

Before launch, configure MongoDB, owner access, business timezone/currency, API/frontend origins, real contact/policy content, services and areas. The automated checks use the Mongo-compatible preview adapter; verify database connectivity and indexes in your deployment. If historic duplicate reviews exist for the same booking, preserve them for manual reconciliation before creating the unique review index. Native browser interaction and live MongoDB testing require a local browser/database environment.
