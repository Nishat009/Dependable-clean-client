const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const { createDemoDb } = require('./demoDb');
const { demoAccounts, hashPassword, verifyPassword, createToken, readToken } = require('./auth');
const v = require('./validation');

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
const fail = (res, status, error) => res.status(status).json({ error });
const demoMode = !mongoUri && process.env.NODE_ENV !== 'production';

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
  const locations = db.collection('location');
  await users.createIndex({ email: 1 }, { unique: true });

  // ---------- Accounts ----------
  const teamRole = async (email) => {
    const record = await admins.findOne({ email });
    return record ? (record.role || (record.superAdmin ? 'superAdmin' : record.staff ? 'staff' : 'superAdmin')) : null;
  };
  const isAdminEmail = async (email) => Boolean(await teamRole(email));
  const session = async (user) => ({
    token: createToken(user.email),
    user: { name: user.name, email: user.email, role: await teamRole(user.email) || 'customer', demo: Boolean(user.demo) }
  });
  const requireUser = asyncRoute(async (req, res, next) => {
    const email = readToken(req.headers.authorization);
    const user = email && await users.findOne({ email });
    if (!user) return fail(res, 401, 'Please sign in again.');
    req.user = user;
    next();
  });
  const requireStaff = [requireUser, asyncRoute(async (req, res, next) => {
    if (!await isAdminEmail(req.user.email)) return fail(res, 403, 'Only team members can do that.');
    next();
  })];
  const requireSuperAdmin = [requireUser, asyncRoute(async (req, res, next) => {
    if (await teamRole(req.user.email) !== 'superAdmin') return fail(res, 403, 'Only the super admin can do that.');
    next();
  })];
  const requireAdmin = requireSuperAdmin;
  async function createUser({ name, email, password }) {
    const user = { name, email, password: hashPassword(password), createdAt: new Date() };
    try {
      await users.insertOne(user);
      return user;
    } catch (error) {
      if (error.code === 11000) return null;
      throw error;
    }
  }

  // DEMO_ACCOUNTS=off removes the demo sign-in for a real launch.
  const demoEnabled = process.env.DEMO_ACCOUNTS !== 'off';
  if (demoEnabled) {
    for (const account of Object.values(demoAccounts)) {
      if (!await users.findOne({ email: account.email })) {
        await users.insertOne({ name: account.name, email: account.email, password: hashPassword(account.password), demo: true, createdAt: new Date() })
          .catch((error) => { if (error.code !== 11000) throw error; });
      }
      if (account.role && !await isAdminEmail(account.email)) await admins.insertOne({ email: account.email, role: account.role });
    }
  }

  const accountExists = 'An account with this email already exists. Please sign in.';
  app.post('/signup', asyncRoute(async (req, res) => {
    const name = v.text(req.body.name, 80);
    const email = v.normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    if (!name) return fail(res, 400, 'Please enter your name.');
    if (!v.isEmail(email)) return fail(res, 400, 'Please enter a valid email address.');
    if (password.length < 6) return fail(res, 400, 'Your password needs at least 6 characters.');
    if (await users.findOne({ email })) return fail(res, 409, accountExists);
    const user = await createUser({ name, email, password });
    if (!user) return fail(res, 409, accountExists);
    res.json(await session(user));
  }));
  app.post('/login', asyncRoute(async (req, res) => {
    const user = await users.findOne({ email: v.normalizeEmail(req.body.email) });
    if (!user || !verifyPassword(String(req.body.password || ''), user.password)) return fail(res, 401, 'The email or password is not correct.');
    res.json(await session(user));
  }));
  app.post('/demoLogin', asyncRoute(async (req, res) => {
    if (!demoEnabled) return fail(res, 404, 'Demo accounts are turned off.');
    if (!Object.hasOwn(demoAccounts, req.body.role)) return fail(res, 400, 'Choose the customer, staff or admin demo.');
    res.json(await session(await users.findOne({ email: demoAccounts[req.body.role].email })));
  }));
  app.get('/me', requireUser, asyncRoute(async (req, res) => res.json((await session(req.user)).user)));

  // ---------- Locations ----------
  // The thanas of the Dhaka Metropolitan Police, plus the upazilas of Dhaka district from bdapis.com.
  // The list is cached for a day, so bookings do not wait on the outside API.
  const thanaUrl = 'https://bdapis.com/api/v1.2/district/dhaka';
  const metroThanas = ['Adabor', 'Badda', 'Banani', 'Bangshal', 'Bhashantek', 'Bhatara', 'Biman Bandar', 'Cantonment', 'Chawkbazar', 'Dakshinkhan', 'Darus Salam', 'Demra', 'Dhanmondi', 'Gendaria', 'Gulshan', 'Hatirjheel', 'Hazaribagh', 'Jatrabari', 'Kadamtali', 'Kafrul', 'Kalabagan', 'Kamrangirchar', 'Khilgaon', 'Khilkhet', 'Kotwali', 'Lalbagh', 'Mirpur', 'Mohammadpur', 'Motijheel', 'Mugda', 'New Market', 'Pallabi', 'Paltan', 'Ramna', 'Rampura', 'Rupnagar', 'Sabujbagh', 'Shah Ali', 'Shahbagh', 'Shahjahanpur', 'Sher-e-Bangla Nagar', 'Shyampur', 'Sutrapur', 'Tejgaon', 'Tejgaon Industrial Area', 'Turag', 'Uttara East', 'Uttara West', 'Uttarkhan', 'Vatara', 'Wari'];
  const fallbackUpazilas = ['Dhamrai', 'Dohar', 'Keraniganj', 'Nawabganj', 'Savar'];
  let thanaCache = { list: null, until: 0 };
  const readDhakaThanas = async () => {
    if (thanaCache.list && thanaCache.until > Date.now()) return thanaCache.list;
    let upazilas = fallbackUpazilas;
    try {
      const response = await fetch(thanaUrl, { signal: AbortSignal.timeout(4000) });
      const rows = response.ok ? (await response.json()).data : null;
      const found = Array.isArray(rows) ? rows.flatMap((row) => row.upazillas || row.upazilas || []).filter((item) => typeof item === 'string') : [];
      if (found.length) upazilas = found;
    } catch {
      // Keep the built-in upazilas and ask the API again after the short cache below.
    }
    const list = [...new Set([...metroThanas, ...upazilas])].sort((a, b) => a.localeCompare(b));
    thanaCache = { list, until: Date.now() + (upazilas === fallbackUpazilas ? 5 : 24 * 60) * 60 * 1000 };
    return list;
  };
  const listLocations = async () => (await locations.find({}).toArray()).sort((a, b) => a.name.localeCompare(b.name));
  // Every location is in Dhaka, inside one of its thanas.
  const readLocation = async (body) => {
    const location = { name: v.text(body.name, 80), city: 'Dhaka', thana: v.text(body.thana, 80), address: v.text(body.address, 200) };
    if (!location.name) return { error: 'Please enter a location name.' };
    if (!(await readDhakaThanas()).includes(location.thana)) return { error: 'Please choose a Dhaka thana from the list.' };
    return { location };
  };
  const locationTaken = async (name, exceptId) => (await locations.find({}).toArray())
    .some((row) => row.name.toLowerCase() === name.toLowerCase() && String(row._id) !== String(exceptId));

  app.get('/locations', asyncRoute(async (_req, res) => res.json(await listLocations())));
  app.get('/dhakaThanas', asyncRoute(async (_req, res) => res.json(await readDhakaThanas())));
  app.post('/addLocation', requireSuperAdmin, asyncRoute(async (req, res) => {
    const { location, error } = await readLocation(req.body);
    if (error) return fail(res, 400, error);
    if (await locationTaken(location.name)) return fail(res, 409, 'That location is already on the list.');
    await locations.insertOne(location);
    res.json(location);
  }));
  app.patch('/updateLocation/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid location id.');
    const { location, error } = await readLocation(req.body);
    if (error) return fail(res, 400, error);
    if (await locationTaken(location.name, id)) return fail(res, 409, 'That location is already on the list.');
    const result = await locations.updateOne({ _id: id }, { $set: location });
    if (!result.matchedCount) return fail(res, 404, 'Location not found.');
    res.json({ _id: id, ...location });
  }));
  app.delete('/deleteLocation/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid location id.');
    if (!(await locations.deleteOne({ _id: id })).deletedCount) return fail(res, 404, 'Location not found.');
    // Take the location off every service that listed it.
    for (const service of await services.find({}).toArray()) {
      if (service.locations?.includes(String(id))) await services.updateOne({ _id: service._id }, { $set: { locations: service.locations.filter((item) => item !== String(id)) } });
    }
    res.json(true);
  }));

  // ---------- Services ----------
  const listServices = async () => (await services.find({}).toArray()).sort(v.byId);
  const locationIds = async () => new Set((await locations.find({}).toArray()).map((row) => String(row._id)));

  app.get('/services', requireUser, asyncRoute(async (_req, res) => res.json(await listServices())));
  app.get('/serviceList', requireUser, asyncRoute(async (_req, res) => res.json(await listServices())));
  app.get('/book/:id', requireUser, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid service id.');
    const service = await services.findOne({ _id: id });
    if (!service) return fail(res, 404, 'Service not found.');
    res.json(service);
  }));
  app.post('/addService', requireAdmin, asyncRoute(async (req, res) => {
    const { service, error } = v.readService(req.body, await locationIds());
    if (error) return fail(res, 400, error);
    const file = req.files?.file;
    if (file) service.image = { contentType: file.mimetype, size: file.size, img: file.data };
    await services.insertOne(service);
    res.json(service);
  }));
  app.patch('/updateService/:id', requireAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid service id.');
    const { service, error } = v.readService(req.body, await locationIds());
    if (error) return fail(res, 400, error);
    if (!(await services.updateOne({ _id: id }, { $set: service })).matchedCount) return fail(res, 404, 'Service not found.');
    res.json(await services.findOne({ _id: id }));
  }));
  app.delete('/deleteClasses/:id', requireAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid service id.');
    if (!(await services.deleteOne({ _id: id })).deletedCount) return fail(res, 404, 'Service not found.');
    res.json(true);
  }));

  // ---------- Bookings ----------
  app.post('/addAllBook', requireUser, asyncRoute(async (req, res) => {
    const id = parseId(req.body.serviceId);
    const service = id && await services.findOne({ _id: id });
    if (!service) return fail(res, 400, 'Please choose a service to book.');
    const date = v.text(req.body.date, 10);
    if (!v.isIsoDate(date)) return fail(res, 400, 'Please choose a date for your clean.');
    if (date < v.earliestBookingDate()) return fail(res, 400, `Please choose a date at least ${v.BOOKING_LEAD_DAYS} days from today.`);
    const thana = v.text(req.body.thana, 80);
    if (!(await readDhakaThanas()).includes(thana)) return fail(res, 400, 'Please choose a valid Dhaka thana.');
    const address = v.text(req.body.address, 300);
    if (!address) return fail(res, 400, 'Please enter the service address.');
    // When locations exist, the booking must name one the service covers. A service with no locations covers them all.
    const allLocations = await listLocations();
    let location = null;
    if (allLocations.length) {
      const covered = service.locations?.length ? allLocations.filter((row) => service.locations.includes(String(row._id))) : allLocations;
      location = covered.find((row) => String(row._id) === String(req.body.locationId));
      if (!location) return fail(res, 400, 'Please choose a location we serve for this clean.');
    }
    const booking = {
      serviceId: String(service._id), serviceName: service.serviceName, price: Number(service.price), date, address, notes: v.text(req.body.notes, 1000),
      locationId: location ? String(location._id) : null, locationName: location ? [location.name, location.city].filter(Boolean).join(', ') : null, thana,
      name: req.user.name, email: req.user.email, status: 'Pending', createdAt: new Date().toISOString()
    };
    await bookings.insertOne(booking);
    res.json(booking);
  }));
  app.get('/bookingList', requireUser, asyncRoute(async (req, res) => res.json((await bookings.find({ email: req.user.email }).toArray()).sort(v.newestFirst))));
  app.get('/orderList', requireSuperAdmin, asyncRoute(async (_req, res) => res.json((await bookings.find({}).toArray()).sort(v.newestFirst))));
  app.patch('/updateOrderList/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid booking id.');
    if (!v.bookingStatuses.includes(req.body.status)) return fail(res, 400, 'Choose a valid booking status.');
    if (!(await bookings.updateOne({ _id: id }, { $set: { status: req.body.status } })).matchedCount) return fail(res, 404, 'Booking not found.');
    res.json(true);
  }));

  // ---------- Reviews ----------
  // New reviews wait for an admin. Reviews saved before moderation existed have no status and count as approved.
  const reviewStatus = (review) => review.status || 'Approved';
  const withStatus = (review) => ({ ...review, status: reviewStatus(review) });

  app.post('/addReview', requireUser, asyncRoute(async (req, res) => {
    const orderId = parseId(req.body.orderId);
    if (!orderId) return fail(res, 400, 'Please choose one of your orders.');
    const order = await bookings.findOne({ _id: orderId, email: req.user.email });
    if (!order) return fail(res, 400, 'That order does not belong to your account.');
    if (await reviews.findOne({ orderId: String(orderId) })) return fail(res, 409, 'You have already reviewed this order.');
    const comments = v.text(req.body.comments, 1000);
    const rating = Math.round(Number(req.body.rating));
    if (comments.length < 10) return fail(res, 400, 'Please write at least 10 characters.');
    if (!(rating >= 1 && rating <= 5)) return fail(res, 400, 'Please choose a rating from 1 to 5.');
    const review = { name: req.user.name, email: req.user.email, orderId: String(orderId), orderName: order.serviceName, rating, comments, status: 'Pending', createdAt: new Date().toISOString() };
    await reviews.insertOne(review);
    res.json(review);
  }));
  app.get('/reviews', asyncRoute(async (_req, res) => {
    const approved = (await reviews.find({}).toArray()).filter((review) => reviewStatus(review) === 'Approved').sort(v.newestFirst);
    res.json(approved.map(({ email, ...review }) => withStatus(review)));
  }));
  app.get('/myReviews', requireUser, asyncRoute(async (req, res) => res.json((await reviews.find({ email: req.user.email }).toArray()).sort(v.newestFirst).map(withStatus))));
  // The customer's orders, newest first, each marked when it already has a review.
  app.get('/reviewOrders', requireUser, asyncRoute(async (req, res) => {
    const reviewed = new Set((await reviews.find({ email: req.user.email }).toArray()).map((review) => review.orderId));
    res.json((await bookings.find({ email: req.user.email }).toArray()).sort(v.newestFirst).map((order) => ({ ...order, reviewed: reviewed.has(String(order._id)) })));
  }));
  app.get('/teamReviews', requireStaff, asyncRoute(async (_req, res) => res.json((await reviews.find({}).toArray()).sort(v.newestFirst).map((review) => {
    const { email, ...safeReview } = review;
    return withStatus(safeReview);
  }))));
  app.get('/reviewList', requireAdmin, asyncRoute(async (_req, res) => res.json((await reviews.find({}).toArray()).sort(v.newestFirst).map(withStatus))));
  app.patch('/updateReview/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid review id.');
    if (!v.reviewStatuses.includes(req.body.status)) return fail(res, 400, 'Choose Pending, Approved or Rejected.');
    if (!(await reviews.updateOne({ _id: id }, { $set: { status: req.body.status } })).matchedCount) return fail(res, 404, 'Review not found.');
    res.json(true);
  }));
  app.delete('/deleteReview/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid review id.');
    if (!(await reviews.deleteOne({ _id: id })).deletedCount) return fail(res, 404, 'Review not found.');
    res.json(true);
  }));

  // ---------- Team ----------
  // Adding a teammate who has no account creates one with the temporary password, so they can sign in right away.
  app.post('/addAdmin', requireSuperAdmin, asyncRoute(async (req, res) => {
    const email = v.normalizeEmail(req.body.email);
    if (!v.isEmail(email)) return fail(res, 400, 'Please enter a valid email address.');
    let user = await users.findOne({ email });
    const created = !user;
    const onTeam = await isAdminEmail(email);
    if (onTeam && user) return fail(res, 409, `${user.name || email} is already on the team.`);
    if (!user) {
      const name = v.text(req.body.name, 80);
      const password = String(req.body.password || '');
      if (!name || password.length < 6) return fail(res, 400, 'This person does not have an account yet. Add their name and a temporary password of at least 6 characters.');
      user = await createUser({ name, email, password });
      if (!user) return fail(res, 409, 'This account was just created. Please try again.');
    }
    // There is one super admin; everyone added here joins as staff.
    if (!onTeam) await admins.insertOne({ email, role: 'staff' });
    res.json({ email, name: user.name, hasAccount: true, created, role: await teamRole(email) });
  }));
  app.get('/admin', requireSuperAdmin, asyncRoute(async (_req, res) => {
    const rows = await admins.find({}).toArray();
    res.json(await Promise.all(rows.map(async (row) => {
      const user = await users.findOne({ email: row.email });
      return { _id: row._id, email: row.email, name: user?.name || '', hasAccount: Boolean(user), role: await teamRole(row.email) };
    })));
  }));
  app.delete('/deleteAdmin/:email', requireSuperAdmin, asyncRoute(async (req, res) => {
    const email = v.normalizeEmail(req.params.email);
    if (email === req.user.email) return fail(res, 400, 'You cannot remove your own admin access.');
    if ((await teamRole(email)) === 'superAdmin') return fail(res, 403, 'Super admin access cannot be removed here.');
    if (!(await admins.deleteOne({ email })).deletedCount) return fail(res, 404, 'That person is not a staff member.');
    res.json(true);
  }));
  app.post('/isAdmin', asyncRoute(async (req, res) => res.json(await isAdminEmail(v.normalizeEmail(req.body.email)))));

  app.use((_req, res) => fail(res, 404, 'Not found.'));
  app.use((err, _req, res, _next) => {
    console.error(err);
    fail(res, 500, 'Internal server error.');
  });
  app.listen(port, () => console.log(`Dependable Clean API listening on http://localhost:${port}`));
}

start().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
