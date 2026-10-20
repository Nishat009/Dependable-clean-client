-- Dependable Clean database schema
--
-- The app runs on MongoDB. The schema it actually runs is
-- database/migrations/001-initial-schema.js (npm run db:schema). This file describes the
-- same 10 collections and indexes as SQL tables, so the data model can be read and
-- reviewed in one place. It is plain SQL written for PostgreSQL and checked to load in SQLite.
--
-- Column names match the MongoDB field names. id holds the MongoDB ObjectId as 24 hex
-- characters. Nested objects and lists are stored in JSON columns.
--
-- Demo data: database/seed.sql (SQL), backend/seed.js (MongoDB, npm run db:setup).

-- Everyone who can sign in. Passwords are scrypt hashes ("salt:hash"), never plain text.
CREATE TABLE "user" (
  id            CHAR(24)     PRIMARY KEY,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password      VARCHAR(200),                -- empty until an invited team member sets one
  phone         VARCHAR(40),
  active        BOOLEAN      DEFAULT TRUE,   -- FALSE when the owner removes a team member
  invited       BOOLEAN      DEFAULT FALSE,  -- TRUE until the invited member sets a password
  setupHash     VARCHAR(200),                -- hash of the one-time account setup link
  setupExpires  BIGINT       DEFAULT 0,      -- setup link expiry, milliseconds since 1970
  demo          BOOLEAN      DEFAULT FALSE,  -- demo sign-in accounts
  createdAt     TIMESTAMP    NOT NULL
);
CREATE UNIQUE INDEX user_email ON "user" (email);

-- Team roles. A signed-in user without a row here is a customer.
CREATE TABLE admin (
  id     CHAR(24)     PRIMARY KEY,
  email  VARCHAR(150) NOT NULL,
  role   VARCHAR(20)  NOT NULL CHECK (role IN ('superAdmin', 'sub_admin', 'staff'))
);
CREATE UNIQUE INDEX admin_email ON admin (email);

-- Services, prices and details.
CREATE TABLE service (
  id                CHAR(24)      PRIMARY KEY,
  serviceName       VARCHAR(120)  NOT NULL,
  price             NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category          VARCHAR(80),
  duration          VARCHAR(80),
  teamSize          INTEGER,
  idealFor          VARCHAR(200),
  details           TEXT,
  includes          JSON,                    -- list of what the clean covers
  suppliesIncluded  BOOLEAN       DEFAULT TRUE,
  active            BOOLEAN       DEFAULT TRUE,
  image             JSON                     -- optional upload: contentType, size, img
);

-- Service areas customers can book in.
CREATE TABLE location (
  id       CHAR(24)     PRIMARY KEY,
  name     VARCHAR(120) NOT NULL,
  city     VARCHAR(80),
  thana    VARCHAR(80)  NOT NULL,
  address  VARCHAR(300),
  active   BOOLEAN      DEFAULT TRUE
);
CREATE INDEX location_name ON location (name);

-- Bookings. Service, area and customer details are copied in when the booking is made.
CREATE TABLE book (
  id             CHAR(24)      PRIMARY KEY,
  serviceId      CHAR(24)      NOT NULL REFERENCES service (id),
  serviceName    VARCHAR(120)  NOT NULL,
  price          NUMERIC(10,2) NOT NULL,
  date           DATE          NOT NULL,
  address        VARCHAR(300)  NOT NULL,
  notes          VARCHAR(1000),
  locationId     CHAR(24)      NOT NULL REFERENCES location (id),
  locationName   VARCHAR(200),
  thana          VARCHAR(80)   NOT NULL,
  name           VARCHAR(80),
  email          VARCHAR(150)  NOT NULL,     -- the customer
  phone          VARCHAR(40),
  status         VARCHAR(20)   NOT NULL DEFAULT 'requested'
                 CHECK (status IN ('requested', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled')),
  staffEmail     VARCHAR(150),               -- the assigned staff member
  scope          JSON,                       -- service details, includes, duration at booking time
  internalNotes  JSON,                       -- team notes: text, author, createdAt
  changeRequest  JSON,                       -- customer reschedule or cancel request
  paymentRecorded NUMERIC(10,2),
  createdAt      TIMESTAMP     NOT NULL
);
CREATE INDEX book_email ON book (email);
CREATE INDEX book_staffEmail ON book (staffEmail);
CREATE INDEX book_status ON book (status);

-- Customer reviews. One review per completed booking; the owner approves them.
CREATE TABLE review (
  id         CHAR(24)      PRIMARY KEY,
  name       VARCHAR(80)   NOT NULL,
  email      VARCHAR(150),
  orderId    CHAR(24)      REFERENCES book (id),  -- empty for the demo reviews
  orderName  VARCHAR(120),
  rating     INTEGER       NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comments   VARCHAR(1000) NOT NULL,
  status     VARCHAR(20)   NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Hidden')),
  createdAt  TIMESTAMP
);
CREATE UNIQUE INDEX review_orderId ON review (orderId) WHERE orderId IS NOT NULL;

-- Customer support conversations, one per customer.
CREATE TABLE conversation (
  id          CHAR(24)     PRIMARY KEY,
  email       VARCHAR(150) NOT NULL,
  name        VARCHAR(80),
  status      VARCHAR(20)  NOT NULL DEFAULT 'open',
  staffEmail  VARCHAR(150),
  staffName   VARCHAR(80),
  createdAt   TIMESTAMP    NOT NULL           -- time of the latest message
);
CREATE UNIQUE INDEX conversation_email ON conversation (email);

-- Support messages.
CREATE TABLE message (
  id              CHAR(24)      PRIMARY KEY,
  conversationId  CHAR(24)      NOT NULL REFERENCES conversation (id),
  author          VARCHAR(150)  NOT NULL,
  authorName      VARCHAR(80),
  text            VARCHAR(2000) NOT NULL,
  readBy          JSON,                       -- emails that have read the message
  createdAt       TIMESTAMP     NOT NULL
);
CREATE INDEX message_conversationId ON message (conversationId);

-- Log of team changes.
CREATE TABLE activity (
  id         CHAR(24)     PRIMARY KEY,
  actor      VARCHAR(150) NOT NULL,
  action     VARCHAR(120) NOT NULL,
  target     VARCHAR(120),
  createdAt  TIMESTAMP    NOT NULL
);
CREATE INDEX activity_createdAt ON activity (createdAt DESC);

-- Business contact details, FAQ, cancellation policy and offers.
CREATE TABLE settings (
  id                  CHAR(24)     PRIMARY KEY,
  key                 VARCHAR(40)  NOT NULL,
  timezone            VARCHAR(60),
  currency            VARCHAR(10),
  email               VARCHAR(150),
  phone               VARCHAR(40),
  faq                 TEXT,
  cancellationPolicy  TEXT,
  offers              TEXT
);
CREATE UNIQUE INDEX settings_key ON settings (key);
