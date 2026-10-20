# Database schema

The application uses MongoDB. The complete executable schema is in
`migrations/001-initial-schema.js`. It creates all ten
collections and their indexes. Documents remain flexible, matching the existing
API; no additional document validators or relational foreign keys are imposed.

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

The app does not read these files; they are a readable SQL copy of the data model and
demo data. They are written for PostgreSQL and also load in SQLite. The demo sign-in
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
| `book` | Bookings and status history | Separate `email`, `staffEmail`, `status` indexes |
| `review` | Customer reviews | Unique `orderId`, only when `orderId` is a string |
| `conversation` | Customer support conversations | Unique `email` |
| `message` | Support messages | `conversationId` |
| `activity` | Team activity log | `createdAt` descending |
| `settings` | Business details, FAQ, policy and offers | Unique `key` |
