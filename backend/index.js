const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const { sampleData } = require('./sampleData');
const { demoAccounts, hashPassword, verifyPassword, createToken, readToken } = require('./auth');

// Some networks refuse the SRV lookups that mongodb+srv:// needs, so DNS_SERVERS can name other resolvers.
if (process.env.DNS_SERVERS) require('node:dns').setServers(process.env.DNS_SERVERS.split(',').map((server) => server.trim()));

const app = express();
const port = Number(process.env.PORT) || 5000;
const databaseName = process.env.DB_NAME || 'houseCleaning';
const mongoUri = process.env.MONGODB_URI || (process.env.DB_USER && process.env.DB_PASS
  ? `mongodb+srv://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASS)}@cluster0.ktoki.mongodb.net/${databaseName}?retryWrites=true&w=majority`
  : null);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
// CLIENT_ORIGIN can list several sites, separated by commas, such as the Vercel URL and localhost.
const clientOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean);
app.use(cors({ origin: clientOrigins }));
app.use(fileUpload());
// Express 5 leaves req.body undefined when a request has no body.
app.use((req, _res, next) => { req.body ??= {}; next(); });

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const parseId = (value) => ObjectId.isValid(value) ? new ObjectId(value) : null;
const demoMode = !mongoUri && process.env.NODE_ENV !== 'production';

function createDemoDb() {
  const sample = sampleData();
  const data = {
    service: sample.service,
    review: sample.review.map((review) => ({ ...review, _id: new ObjectId(), demo: true })),
    book: [],
    user: [],
    admin: sample.admin.map((admin) => ({ ...admin, _id: new ObjectId() }))
  };
  return { collection(name) {
    const rows = data[name];
    const matches = (row, filter = {}) => Object.entries(filter).every(([key, value]) => String(row[key]) === String(value));
    return {
      find(filter = {}) { return { toArray: async () => rows.filter((row) => matches(row, filter)) }; },
      async findOne(filter) { return rows.find((row) => matches(row, filter)) || null; },
      async insertOne(value) { const row = { ...value, _id: new ObjectId() }; rows.push(row); return { insertedId: row._id }; },
      async updateOne(filter, update) { const row = rows.find((item) => matches(item, filter)); if (!row) return { modifiedCount: 0 }; Object.assign(row, update.$set); return { modifiedCount: 1 }; },
      async createIndex() {},
      async deleteOne(filter) { const index = rows.findIndex((row) => matches(row, filter)); if (index < 0) return { deletedCount: 0 }; rows.splice(index, 1); return { deletedCount: 1 }; }
    };
  } };
}

app.get('/', (_req, res) => res.json({ app: 'Dependable Clean API', mode: demoMode ? 'local preview' : 'database' }));
app.get('/health', (_req, res) => res.json({ ok: true, mode: demoMode ? 'local preview' : 'database' }));

// Atlas answers with "tlsv1 alert internal error" when the caller's IP address is not on its access list.
function explainConnectionError(error) {
  if (/alert internal error|alert number 80/i.test(error.message)) {
    return 'MongoDB Atlas refused the connection because this server\'s IP address is not allowed. In Atlas, open Network Access and add 0.0.0.0/0 (Render does not use fixed IP addresses), then redeploy.';
  }
  if (/querySrv/i.test(error.message)) return error.message + '. Set DNS_SERVERS=8.8.8.8,1.1.1.1 if your network blocks SRV lookups.';
  if (/bad auth|authentication failed/i.test(error.message)) return 'MongoDB rejected the username or password in MONGODB_URI.';
  return error.message;
}

async function start() {
  if (!mongoUri && !demoMode) throw new Error('Set MONGODB_URI or DB_USER and DB_PASS in backend/.env before starting the API.');
  let db;
  if (demoMode) db = createDemoDb();
  else {
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 15000 });
    try {
      await client.connect();
    } catch (error) {
      throw new Error(explainConnectionError(error));
    }
    db = client.db(databaseName);
  }
  const services = db.collection('service');
  const reviews = db.collection('review');
  const bookings = db.collection('book');
  const admins = db.collection('admin');
  const users = db.collection('user');
  await users.createIndex({ email: 1 }, { unique: true });

  const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
  const isAdminEmail = async (email) => Boolean(await admins.findOne({ email }));
  const session = async (user) => ({
    token: createToken(user.email),
    user: { name: user.name, email: user.email, role: await isAdminEmail(user.email) ? 'admin' : 'customer', demo: Boolean(user.demo) }
  });
  const requireUser = asyncRoute(async (req, res, next) => {
    const email = readToken(req.headers.authorization);
    const user = email && await users.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Please sign in again.' });
    req.user = user;
    next();
  });
  const requireAdmin = [requireUser, asyncRoute(async (req, res, next) => {
    if (!await isAdminEmail(req.user.email)) return res.status(403).json({ error: 'Only admins can do that.' });
    next();
  })];

  // DEMO_ACCOUNTS=off removes the demo sign-in for a real launch.
  const demoEnabled = process.env.DEMO_ACCOUNTS !== 'off';
  if (demoEnabled) {
    for (const [role, account] of Object.entries(demoAccounts)) {
      if (!await users.findOne({ email: account.email })) {
        await users.insertOne({ name: account.name, email: account.email, password: hashPassword(account.password), demo: true, createdAt: new Date() })
          .catch((error) => { if (error.code !== 11000) throw error; });
      }
      if (role === 'admin' && !await isAdminEmail(account.email)) await admins.insertOne({ email: account.email });
    }
  }

  const accountExists = { error: 'An account with this email already exists. Please sign in.' };
  app.post('/signup', asyncRoute(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    if (!name) return res.status(400).json({ error: 'Please enter your name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (password.length < 6) return res.status(400).json({ error: 'Your password needs at least 6 characters.' });
    if (await users.findOne({ email })) return res.status(409).json(accountExists);
    const user = { name, email, password: hashPassword(password), createdAt: new Date() };
    try {
      await users.insertOne(user);
    } catch (error) {
      if (error.code === 11000) return res.status(409).json(accountExists);
      throw error;
    }
    res.status(201).json(await session(user));
  }));
  app.post('/login', asyncRoute(async (req, res) => {
    const user = await users.findOne({ email: normalizeEmail(req.body.email) });
    if (!user || !verifyPassword(String(req.body.password || ''), user.password)) return res.status(401).json({ error: 'The email or password is not correct.' });
    res.json(await session(user));
  }));
  app.post('/demoLogin', asyncRoute(async (req, res) => {
    if (!demoEnabled) return res.status(404).json({ error: 'Demo accounts are turned off.' });
    if (!Object.hasOwn(demoAccounts, req.body.role)) return res.status(400).json({ error: 'Choose the customer or admin demo.' });
    const account = demoAccounts[req.body.role];
    res.json(await session(await users.findOne({ email: account.email })));
  }));
  app.get('/me', requireUser, asyncRoute(async (req, res) => res.json((await session(req.user)).user)));

  app.post('/addService', requireAdmin, asyncRoute(async (req, res) => {
    const file = req.files?.file;
    const image = file ? { contentType: file.mimetype, size: file.size, img: file.data } : null;
    const result = await services.insertOne({ serviceName: req.body.serviceName, details: req.body.details, image, price: Number(req.body.price), category: req.body.category, duration: req.body.duration });
    res.send(Boolean(result.insertedId));
  }));
  app.get('/services', asyncRoute(async (_req, res) => res.json(await services.find({}).toArray())));
  app.post('/addReview', requireUser, asyncRoute(async (req, res) => {
    res.json(await reviews.insertOne({ name: req.user.name, email: req.user.email, rating: Number(req.body.rating) || 5, comments: req.body.comments }));
  }));
  app.get('/reviews', asyncRoute(async (_req, res) => res.json((await reviews.find({}).toArray()).map(({ email, ...review }) => review))));
  app.get('/book/:id', asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid service id.' });
    const service = await services.findOne({ _id: id });
    if (!service) return res.status(404).json({ error: 'Service not found.' });
    res.json(service);
  }));
  app.post('/addAllBook', requireUser, asyncRoute(async (req, res) => {
    const booking = { ...req.body, name: req.user.name, email: req.user.email, status: 'Pending', createdAt: new Date().toISOString() };
    res.send(Boolean((await bookings.insertOne(booking)).insertedId));
  }));
  app.get('/orderList', requireAdmin, asyncRoute(async (_req, res) => res.json(await bookings.find({}).toArray())));
  app.patch('/updateOrderList/:id', requireAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid booking id.' });
    const result = await bookings.updateOne({ _id: id }, { $set: { status: req.body.status } });
    res.send(result.modifiedCount > 0);
  }));
  app.get('/serviceList', asyncRoute(async (_req, res) => res.json(await services.find({}).toArray())));
  app.delete('/deleteClasses/:id', requireAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid service id.' });
    res.send((await services.deleteOne({ _id: id })).deletedCount > 0);
  }));
  app.get('/bookingList', requireUser, asyncRoute(async (req, res) => res.json(await bookings.find({ email: req.user.email }).toArray())));
  app.post('/addAdmin', requireAdmin, asyncRoute(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ error: 'Please enter an email address.' });
    if (await isAdminEmail(email)) return res.send(true);
    res.send(Boolean((await admins.insertOne({ email })).insertedId));
  }));
  app.get('/admin', requireAdmin, asyncRoute(async (_req, res) => res.json(await admins.find({}).toArray())));
  app.post('/isAdmin', asyncRoute(async (req, res) => res.json(await isAdminEmail(normalizeEmail(req.body.email)))));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  });
  app.listen(port, () => console.log(`Dependable Clean API listening on http://localhost:${port}`));
}

start().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
