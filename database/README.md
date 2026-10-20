# Database schema

The application uses MongoDB. The complete executable schema is in
`migrations/001-initial-schema.js`, rather than a SQL file. It creates all ten
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

To also add demo data, run `npm run db:setup` instead.

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
