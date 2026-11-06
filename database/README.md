# Database schema

The application uses MongoDB. The executable schema is the migrations in `migrations/`, run in order by
`migrations/index.js`:

- `001-initial-schema.js` creates all ten collections and their base indexes.
- `002-indexes-and-validators.js` adds compound indexes for the common queries and `$jsonSchema` validators
  (required fields, types and allowed values) on `user`, `admin`, `service`, `location`, `book`, `review`,
  `conversation` and `message`. Validators use `validationLevel: "moderate"`, so older documents are kept while every
  new insert and update is checked.

## Referential integrity

MongoDB has no foreign keys, so the API keeps references intact itself:

- A service or service area that any booking points to is archived (`active: false`) instead of deleted.
- Removing a team member switches their account off instead of deleting it, so their jobs and messages keep their author.
- Bookings copy the service name, price and scope when they are made, so later edits never change history.
- Only reviews (moderated content) are hard-deleted; nothing references them.

## Create the database from scratch

1. Run `npm install` from the repository root.
2. Copy `backend/.env.example` to `backend/.env`. Set `MONGODB_URI` and
   `DB_NAME` (default: `houseCleaning`). The MongoDB user needs permission to
   create collections and indexes.
3. From the repository root, run:

   ```bash
   npm run db:schema
   ```

`backend/schema.js` loads the backend environment, connects to MongoDB and runs
the migration. MongoDB creates the database when the first collection is created.
Rerunning the migration preserves existing documents and reuses existing indexes.
Existing duplicates that violate a unique index must be resolved before that
index can be created; failures produce a nonzero exit code.

To also add demo data, run `npm run db:setup` instead. That runs `backend/seed.js`,
the authoritative seed, with the data in `backend/sampleData.js`.

## SQL files

| File | Purpose |
| --- | --- |
| `schema.sql` | The same ten collections and indexes as SQL tables (`CREATE TABLE`, `CREATE INDEX`), with field types, allowed values and links between tables |
| `seed.sql` | The same demo data as `backend/seed.js`, as `INSERT` statements: 6 services, 3 service areas, 2 approved reviews and the demo owner role |

The app does not read these files (documentation only); they are a readable SQL copy of the data model and
demo data. `backend/test/security.test.js` fails if `schema.sql` lists different tables or indexes from the
migrations, so it cannot drift. They are written for PostgreSQL and also load in SQLite. The demo sign-in
accounts are created by the API when it starts, so they are not in `seed.sql`.

## Collections and indexes

Every collection also has MongoDB's automatic unique `_id` index.
Indexes below are ascending unless marked descending.

| Collection | Purpose | Additional indexes |
| --- | --- | --- |
| `user` | Sign-in accounts and profiles | Unique `email` |
| `admin` | Team roles | Unique `email` |
| `service` | Services, prices and details | None |
| `location` | Service areas | `name` |
| `book` | Bookings and status history | `email`, `staffEmail`, `status`; compound `email` + `createdAt` (desc) and `staffEmail` + `status`; `serviceId`; `locationId` |
| `review` | Customer reviews | Unique `orderId`, only when `orderId` is a string; `status`; `email` |
| `conversation` | Customer support conversations | Unique `email`; `staffEmail` |
| `message` | Support messages | `conversationId`; compound `conversationId` + `createdAt` |
| `activity` | Team activity log | `createdAt` descending |
| `settings` | Business details, FAQ, policy and offers | Unique `key` |
