const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const { sampleData } = require('./sampleData');

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
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(fileUpload());

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const parseId = (value) => ObjectId.isValid(value) ? new ObjectId(value) : null;
const demoMode = !mongoUri && process.env.NODE_ENV !== 'production';

function createDemoDb() {
  const sample = sampleData();
  const data = {
    service: sample.service,
    review: sample.review.map((review) => ({ ...review, _id: new ObjectId(), demo: true })),
    book: [],
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
      async deleteOne(filter) { const index = rows.findIndex((row) => matches(row, filter)); if (index < 0) return { deletedCount: 0 }; rows.splice(index, 1); return { deletedCount: 1 }; }
    };
  } };
}

app.get('/', (_req, res) => res.json({ app: 'Dependable Clean API', mode: demoMode ? 'local preview' : 'database' }));
app.get('/health', (_req, res) => res.json({ ok: true, mode: demoMode ? 'local preview' : 'database' }));

async function start() {
  if (!mongoUri && !demoMode) throw new Error('Set MONGODB_URI or DB_USER and DB_PASS in backend/.env before starting the API.');
  let db;
  if (demoMode) db = createDemoDb();
  else {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(databaseName);
  }
  const services = db.collection('service');
  const reviews = db.collection('review');
  const bookings = db.collection('book');
  const admins = db.collection('admin');

  app.post('/addService', asyncRoute(async (req, res) => {
    const file = req.files?.file;
    const image = file ? { contentType: file.mimetype, size: file.size, img: file.data } : null;
    const result = await services.insertOne({ serviceName: req.body.serviceName, details: req.body.details, image, price: Number(req.body.price), category: req.body.category, duration: req.body.duration });
    res.send(Boolean(result.insertedId));
  }));
  app.get('/services', asyncRoute(async (_req, res) => res.json(await services.find({}).toArray())));
  app.post('/addReview', asyncRoute(async (req, res) => res.json(await reviews.insertOne(req.body))));
  app.get('/reviews', asyncRoute(async (_req, res) => res.json(await reviews.find({}).toArray())));
  app.get('/book/:id', asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid service id.' });
    const service = await services.findOne({ _id: id });
    if (!service) return res.status(404).json({ error: 'Service not found.' });
    res.json(service);
  }));
  app.post('/addAllBook', asyncRoute(async (req, res) => res.send(Boolean((await bookings.insertOne(req.body)).insertedId))));
  app.get('/orderList', asyncRoute(async (_req, res) => res.json(await bookings.find({}).toArray())));
  app.patch('/updateOrderList/:id', asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid booking id.' });
    const result = await bookings.updateOne({ _id: id }, { $set: { status: req.body.status } });
    res.send(result.modifiedCount > 0);
  }));
  app.get('/serviceList', asyncRoute(async (_req, res) => res.json(await services.find({}).toArray())));
  app.delete('/deleteClasses/:id', asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid service id.' });
    res.send((await services.deleteOne({ _id: id })).deletedCount > 0);
  }));
  app.get('/bookingList', asyncRoute(async (req, res) => res.json(await bookings.find({ email: req.query.email }).toArray())));
  app.post('/addAdmin', asyncRoute(async (req, res) => res.send(Boolean((await admins.insertOne({ email: req.body.email })).insertedId))));
  app.get('/admin', asyncRoute(async (_req, res) => res.json(await admins.find({}).toArray())));
  app.post('/isAdmin', asyncRoute(async (req, res) => res.json(Boolean(await admins.findOne({ email: req.body.email })))));

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
