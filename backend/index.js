const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const { createDemoDb } = require('./demoDb');
const { demoAccounts, hashPassword, verifyPassword, createToken, readToken } = require('./auth');
const v = require('./validation');
const crypto = require('node:crypto');
const { can, teamRoles, normalizeRole, normalizeStatus, transitions } = require('./permissions');

// Some networks refuse the SRV lookups that mongodb+srv:// needs, so DNS_SERVERS can name other resolvers.
if (process.env.DNS_SERVERS) require('node:dns').setServers(process.env.DNS_SERVERS.split(',').map((server) => server.trim()));

const app = express();
const port = Number(process.env.PORT) || 5000;
const databaseName = process.env.DB_NAME || 'houseCleaning';
const mongoUri = process.env.MONGODB_URI || null;

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
  if (!mongoUri && !demoMode) throw new Error('Set MONGODB_URI in backend/.env before starting the API.');
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
  await db.collection('conversation').createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ email: 1 }, { unique: true });
  await reviews.createIndex({ orderId: 1 }, { unique: true, partialFilterExpression: { orderId: { $type: 'string' } } });

  // ---------- Accounts ----------
  const teamRole = async (email) => {
    const record = await admins.findOne({ email });
    return record ? normalizeRole(record.role || (record.staff ? 'staff' : 'superAdmin')) : null;
  };
  const isAdminEmail = async (email) => Boolean(await teamRole(email));
  const session = async (user) => ({
    token: createToken(user.email),
    user: { name: user.name, email: user.email, role: await teamRole(user.email) || 'customer', demo: Boolean(user.demo) }
  });
  const requireUser = asyncRoute(async (req, res, next) => {
    const email = readToken(req.headers.authorization);
    const user = email && await users.findOne({ email });
    if (!user || user.active === false || user.invited || (user.demo && !demoEnabled)) return fail(res, 401, 'Please sign in again.');
    req.role = await teamRole(email) || 'customer';
    req.user = user;
    next();
  });
  const requirePermission = (permission) => [requireUser, (req, res, next) => {
    if (!can(req.role, permission)) return fail(res, 403, 'Your account cannot perform this action.');
    next();
  }];
  const requireStaff = requirePermission('jobs');
  const requireSuperAdmin = requirePermission('manage');
  const requireTeamAdmin = requirePermission('team');
  const requireCustomer = requirePermission('book');
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

  // DEMO_ACCOUNTS=off removes the demo sign-in for a real launch, and DEMO_ACCOUNTS=on keeps it in production for a public demo.
  // Local development supports demo accounts with MongoDB as well as preview storage.
  const demoEnabled = process.env.DEMO_ACCOUNTS === 'on' || (process.env.NODE_ENV !== 'production' && process.env.DEMO_ACCOUNTS !== 'off');
  app.get('/authOptions', (_req,res) => res.json({ demoEnabled }));
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
    if (password.length < 12 || password.length > 200) return fail(res, 400, 'Your password needs 12–200 characters.');
    if (await users.findOne({ email })) return fail(res, 409, accountExists);
    const user = await createUser({ name, email, password });
    if (!user) return fail(res, 409, accountExists);
    res.json(await session(user));
  }));
  app.post('/login', asyncRoute(async (req, res) => {
    if (String(req.body.password || '').length > 200) return fail(res, 400, 'Password too long.');
    const user = await users.findOne({ email: v.normalizeEmail(req.body.email) });
    if (!user || user.active === false || user.invited || (user.demo && !demoEnabled) || !verifyPassword(String(req.body.password || ''), user.password)) return fail(res, 401, 'The email or password is not correct.');
    res.json(await session(user));
  }));
  app.post('/demoLogin', asyncRoute(async (req, res) => {
    if (!demoEnabled) return fail(res, 404, 'Demo accounts are turned off.');
    if (!Object.hasOwn(demoAccounts, req.body.role)) return fail(res, 400, 'Choose the customer, staff or admin demo.');
    const user = await users.findOne({ email: demoAccounts[req.body.role].email });
    if (!user || user.active === false) return fail(res, 401, 'Account inactive.');
    res.json(await session(user));
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

  // Customers only see the active areas. Signed-in staff and the super admin also see the ones switched off.
  const activeLocations = async () => (await listLocations()).filter((row) => row.active !== false);
  app.get('/locations', asyncRoute(async (_req, res) => res.json(await activeLocations())));
  app.get('/locationList', requireUser, asyncRoute(async (_req, res) => res.json(await listLocations())));
  app.get('/dhakaThanas', asyncRoute(async (_req, res) => res.json(await readDhakaThanas())));
  app.post('/addLocation', requireSuperAdmin, asyncRoute(async (req, res) => {
    const { location, error } = await readLocation(req.body);
    if (error) return fail(res, 400, error);
    if (await locationTaken(location.name)) return fail(res, 409, 'That location is already on the list.');
    location.active = true;
    await locations.insertOne(location);
    await audit(req, 'service area created', location._id);
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
    await audit(req, 'service area updated', id);
    res.json({ _id: id, ...location });
  }));
  app.patch('/locationStatus/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid location id.');
    if (typeof req.body.active !== 'boolean') return fail(res, 400, 'Please choose active or inactive.');
    if (!(await locations.updateOne({ _id: id }, { $set: { active: req.body.active } })).matchedCount) return fail(res, 404, 'Location not found.');
    await audit(req, req.body.active ? 'service area activated' : 'service area deactivated', id);
    res.json(await locations.findOne({ _id: id }));
  }));
  app.delete('/deleteLocation/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid location id.');
    if (!(await locations.deleteOne({ _id: id })).deletedCount) return fail(res, 404, 'Location not found.');
    await audit(req, 'service area deleted', id);
    res.json(true);
  }));

  // ---------- Services ----------
  const listServices = async () => (await services.find({}).toArray()).sort(v.byId);
  const audit = async (req, action, target) => db.collection('activity').insertOne({ actor: req.user.email, action, target: String(target), createdAt: new Date().toISOString() });

  app.get('/services', asyncRoute(async (_req, res) => res.json((await listServices()).filter(s => s.active !== false))));
  app.get('/serviceList', requireUser, asyncRoute(async (req, res) => res.json((await listServices()).filter(s => can(req.role, 'manage') || s.active !== false))));
  app.get('/book/:id', requireUser, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid service id.');
    const service = await services.findOne({ _id: id });
    if (!service || (service.active === false && !can(req.role, 'manage'))) return fail(res, 404, 'Service not found.');
    res.json(service);
  }));
  app.post('/addService', requireAdmin, asyncRoute(async (req, res) => {
    const { service, error } = v.readService(req.body);
    if (error) return fail(res, 400, error);
    const file = req.files?.file;
    if (file) service.image = { contentType: file.mimetype, size: file.size, img: file.data };
    await services.insertOne(service);
    await audit(req, 'service created', service._id);
    res.json(service);
  }));
  app.patch('/updateService/:id', requireAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid service id.');
    const { service, error } = v.readService(req.body);
    if (error) return fail(res, 400, error);
    if (!(await services.updateOne({ _id: id }, { $set: service })).matchedCount) return fail(res, 404, 'Service not found.');
    await audit(req, 'service updated', id);
    res.json(await services.findOne({ _id: id }));
  }));
  app.delete('/deleteClasses/:id', requireAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid service id.');
    if (!(await services.deleteOne({ _id: id })).deletedCount) return fail(res, 404, 'Service not found.');
    await audit(req, 'service deleted', id);
    res.json(true);
  }));

  // ---------- Bookings ----------
  app.post('/addAllBook', requireCustomer, asyncRoute(async (req, res) => {
    const id = parseId(req.body.serviceId);
    const service = id && await services.findOne({ _id: id });
    if (!can(req.role, 'book')) return fail(res, 403, 'Only customers can request cleaning.');
    if (!service || service.active === false) return fail(res, 400, 'Please choose an active service to book.');
    const date = v.text(req.body.date, 10);
    if (!v.isIsoDate(date)) return fail(res, 400, 'Please choose a date for your clean.');
    if (date < v.earliestBookingDate()) return fail(res, 400, `Please choose a date at least ${v.BOOKING_LEAD_DAYS} days from today.`);
    const thana = v.text(req.body.thana, 80);
    if (!(await readDhakaThanas()).includes(thana)) return fail(res, 400, 'Please choose a valid Dhaka thana.');
    const address = v.text(req.body.address, 300);
    if (!address) return fail(res, 400, 'Please enter the service address.');
    // Every service is offered in every active area, and the booking must name one of them.
    const areas = await activeLocations();
    if (!areas.length) return fail(res, 400, 'No service areas are currently available.');
    const location = areas.find((row) => String(row._id) === String(req.body.locationId));
    if (!location) return fail(res, 400, 'Please choose a location we serve for this clean.');
    if (location.thana !== thana) return fail(res, 400, 'The address thana must match the service area.');
    const booking = {
      serviceId: String(service._id), serviceName: service.serviceName, price: Number(service.price), date, address, notes: v.text(req.body.notes, 1000),
      locationId: String(location._id), locationName: [location.name, location.city].filter(Boolean).join(', '), thana,
      name: req.user.name, email: req.user.email, phone: req.user.phone || '', status: 'requested', scope: { details: service.details, includes: service.includes || [], duration: service.duration, suppliesIncluded: service.suppliesIncluded }, createdAt: new Date().toISOString()
    };
    await bookings.insertOne(booking);
    res.json(booking);
  }));
  const safeBooking = (row, role) => { const result = { ...row, status: normalizeStatus(row.status) }; if (role === 'customer') delete result.internalNotes; return result; };
  const visibleBookings = async (req) => (await bookings.find(can(req.role, 'manage') ? {} : req.role === 'staff' ? { staffEmail: req.user.email } : { email: req.user.email }).toArray()).sort(v.newestFirst).map(row => safeBooking(row, req.role));
  app.get('/bookingList', requireUser, asyncRoute(async (req, res) => res.json(await visibleBookings(req))));
  app.get('/orderList', requireStaff, asyncRoute(async (req, res) => res.json(await visibleBookings(req))));
  app.get('/bookings/:id', requireUser, asyncRoute(async (req, res) => {
    const row = (await visibleBookings(req)).find(row => String(row._id) === req.params.id);
    if (!row) return fail(res, 403, 'Booking unavailable to this account.');
    res.json(row);
  }));
  app.patch('/updateOrderList/:id', requireStaff, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id); const row = id && await bookings.findOne({ _id: id });
    if (!row) return fail(res, 404, 'Booking not found.');
    if (req.role === 'staff' && row.staffEmail !== req.user.email) return fail(res, 403, 'This job is not assigned to you.');
    if (req.body.approveReschedule && can(req.role, 'manage')) {
      const date = row.changeRequest?.date;
      if (row.changeRequest?.type !== 'reschedule' || !v.isIsoDate(date) || date < v.earliestBookingDate() || ['completed','cancelled','in_progress'].includes(normalizeStatus(row.status))) return fail(res, 400, 'Reschedule request is no longer valid.');
      await bookings.updateOne({ _id: id }, { $set: { date, changeRequest: null } }); await audit(req, 'reschedule approved', id); return res.json(true);
    }
    const current = normalizeStatus(row.status); const status = req.body.status;
    const update = {};
    if (status && status !== current) {
      if (!transitions[current]?.includes(status) || (req.role === 'staff' && !['in_progress', 'completed'].includes(status))) return fail(res, 400, 'Invalid status transition.');
      update.status = status;
    }
    if (req.body.staffEmail !== undefined) {
      if (!can(req.role, 'manage')) return fail(res, 403, 'Only the owner assigns jobs.');
      if (!['confirmed', 'assigned'].includes(current)) return fail(res, 400, 'Confirm the booking before assigning staff.');
      const email = v.normalizeEmail(req.body.staffEmail); const staff = await users.findOne({ email });
      if (!staff || staff.active === false || staff.invited || await teamRole(email) !== 'staff') return fail(res, 400, 'Choose active staff with a completed account.');
      update.staffEmail = email; update.status = 'assigned';
    }
    if (update.status === 'assigned' && !update.staffEmail && !row.staffEmail) return fail(res, 400, 'Assign a staff member first.');
    const note = v.text(req.body.internalNote, 2000);
    // A completed job's notes are its final record, so they are closed to new notes.
    if (note && current === 'completed') return fail(res, 400, 'Notes cannot be added to a completed job.');
    if (note) update.internalNotes = [...(row.internalNotes || []), { text: note, author: req.user.email, createdAt: new Date().toISOString() }];
    if (req.body.clearChangeRequest && can(req.role, 'manage')) update.changeRequest = null;
    const result = await bookings.updateOne({ _id: id, status: row.status }, { $set: update });
    if (!result.matchedCount) return fail(res, 409, 'Booking changed. Refresh and try again.');
    await audit(req, 'booking updated', id); res.json(true);
  }));
  app.post('/bookings/:id/request', requireUser, asyncRoute(async (req, res) => {
    if (!can(req.role, 'book')) return fail(res, 403, 'Customers only.');
    const id = parseId(req.params.id); const row = id && await bookings.findOne({ _id: id, email: req.user.email });
    if (!row) return fail(res, 403, 'Booking unavailable.');
    if (['completed', 'cancelled', 'in_progress'].includes(normalizeStatus(row.status))) return fail(res, 400, 'This booking cannot be changed.');
    const { type, date } = req.body;
    if (!['cancellation', 'reschedule'].includes(type) || (type === 'reschedule' && (!v.isIsoDate(date) || date < v.earliestBookingDate()))) return fail(res, 400, 'Choose a valid request and date at least three days ahead.');
    await bookings.updateOne({ _id: id }, { $set: { changeRequest: { type, date: type === 'reschedule' ? date : null, createdAt: new Date().toISOString() } } });
    await audit(req, 'customer change request', id); res.json(true);
  }));

  // ---------- Reviews ----------
  // New reviews wait for an admin. Reviews saved before moderation existed have no status and count as approved.
  const reviewStatus = (review) => review.status || 'Approved';
  const withStatus = (review) => ({ ...review, status: reviewStatus(review) });

  app.post('/addReview', requireCustomer, asyncRoute(async (req, res) => {
    const orderId = parseId(req.body.orderId);
    if (!orderId) return fail(res, 400, 'Please choose one of your orders.');
    const order = await bookings.findOne({ _id: orderId, email: req.user.email });
    if (!order) return fail(res, 403, 'That order does not belong to your account.');
    if (req.role !== 'customer' || normalizeStatus(order.status) !== 'completed') return fail(res, 403, 'Only your completed bookings can be reviewed.');
    if (await reviews.findOne({ orderId: String(orderId) })) return fail(res, 409, 'You have already reviewed this order.');
    const comments = v.text(req.body.comments, 1000);
    const rating = Math.round(Number(req.body.rating));
    if (comments.length < 10) return fail(res, 400, 'Please write at least 10 characters.');
    if (!(rating >= 1 && rating <= 5)) return fail(res, 400, 'Please choose a rating from 1 to 5.');
    const review = { name: req.user.name, email: req.user.email, orderId: String(orderId), orderName: order.serviceName, rating, comments, status: 'Pending', createdAt: new Date().toISOString() };
    try { await reviews.insertOne(review); } catch (error) { if (error.code === 11000) return fail(res, 409, 'This booking already has a review.'); throw error; }
    res.json(review);
  }));
  app.get('/reviews', asyncRoute(async (_req, res) => {
    const approved = (await reviews.find({}).toArray()).filter((review) => reviewStatus(review) === 'Approved').sort(v.newestFirst);
    res.json(approved.map(review => ({ _id: review._id, name: review.name, rating: review.rating, comments: review.comments, status: 'Approved' })));
  }));
  app.get('/myReviews', requireCustomer, asyncRoute(async (req, res) => res.json((await reviews.find({ email: req.user.email }).toArray()).sort(v.newestFirst).map(withStatus))));
  // The customer's orders, newest first, each marked when it already has a review.
  app.get('/reviewOrders', requireCustomer, asyncRoute(async (req, res) => {
    const reviewed = new Set((await reviews.find({ email: req.user.email }).toArray()).map((review) => review.orderId));
    res.json((await bookings.find({ email: req.user.email }).toArray()).filter(order => normalizeStatus(order.status) === 'completed').sort(v.newestFirst).map((order) => ({ ...order, reviewed: reviewed.has(String(order._id)) })));
  }));
  app.get('/teamReviews', requireSuperAdmin, asyncRoute(async (_req, res) => res.json((await reviews.find({}).toArray()).sort(v.newestFirst).map((review) => {
    const { email, ...safeReview } = review;
    return withStatus(safeReview);
  }))));
  app.get('/reviewList', requireAdmin, asyncRoute(async (_req, res) => res.json((await reviews.find({}).toArray()).sort(v.newestFirst).map(withStatus))));
  app.patch('/updateReview/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid review id.');
    if (!v.reviewStatuses.includes(req.body.status)) return fail(res, 400, 'Choose Pending, Approved or Rejected.');
    if (!(await reviews.updateOne({ _id: id }, { $set: { status: req.body.status } })).matchedCount) return fail(res, 404, 'Review not found.');
    await audit(req, 'review ' + req.body.status, id);
    res.json(true);
  }));
  app.delete('/deleteReview/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid review id.');
    if (!(await reviews.deleteOne({ _id: id })).deletedCount) return fail(res, 404, 'Review not found.');
    await audit(req, 'review deleted', id);
    res.json(true);
  }));

  // ---------- Team ----------
  const passwordProblem = (password) => password.length < 12 || password.length > 200 ? 'Use a password of 12–200 characters.' : '';
  // The owner sets the password, so the new staff member or sub admin can sign in with it right away.
  // An invitation that was never set up is finished the same way. Anyone else who already has an account is refused,
  // so the owner never overwrites a customer's password.
  app.post('/addAdmin', requireTeamAdmin, asyncRoute(async (req, res) => {
    const email = v.normalizeEmail(req.body.email);
    const name = v.text(req.body.name, 80);
    const password = String(req.body.password || '');
    const role = req.body.role || 'staff';
    if (!name) return fail(res, 400, 'Please enter a name.');
    if (name.includes('@')) return fail(res, 400, 'Enter their name, not an email address.');
    if (!v.isEmail(email)) return fail(res, 400, 'Please enter a valid email address.');
    if (!teamRoles.includes(role)) return fail(res, 400, 'Choose staff or sub admin.');
    if (passwordProblem(password)) return fail(res, 400, passwordProblem(password));
    const currentRole = await teamRole(email);
    if (currentRole === 'super_admin') return fail(res, 403, 'Owner access cannot be edited.');
    const existing = await users.findOne({ email });
    if (existing && !existing.invited) return fail(res, 409, currentRole ? 'This person is already on your team.' : 'An account with this email already exists.');
    if (existing) await users.updateOne({ email }, { $set: { name, password: hashPassword(password), invited: false, active: true, setupHash: null, setupExpires: 0 } });
    else if (!await createUser({ name, email, password })) return fail(res, 409, 'An account with this email already exists.');
    if (currentRole) await admins.updateOne({ email }, { $set: { role } });
    else await admins.insertOne({ email, role });
    await audit(req, role === 'sub_admin' ? 'sub admin added' : 'staff added', email);
    res.json({ email, name, role });
  }));
  app.post('/setupAccount', asyncRoute(async (req, res) => {
    const setupHash = crypto.createHash('sha256').update(String(req.body.token || '')).digest('hex');
    const user = await users.findOne({ setupHash });
    const password = String(req.body.password || '');
    if (!user || user.setupExpires < Date.now() || user.active === false) return fail(res, 400, 'Setup link expired or invalid.');
    if (password.length < 12 || password.length > 200) return fail(res, 400, 'Use a password of 12–200 characters.');
    const result = await users.updateOne({ _id: user._id, setupHash }, { $set: { password: hashPassword(password), invited: false, setupHash: null, setupExpires: 0 } });
    if (!result.matchedCount) return fail(res, 409, 'Link already used.');
    res.json(true);
  }));
  // Edits a staff member or sub admin: name, role, access, or a new password when they have forgotten theirs.
  app.patch('/staff/:email', requireTeamAdmin, asyncRoute(async (req, res) => {
    const email = v.normalizeEmail(req.params.email);
    if (!teamRoles.includes(await teamRole(email))) return fail(res, 403, 'Only staff and sub admins can be edited.');
    if (req.body.role !== undefined && !teamRoles.includes(req.body.role)) return fail(res, 400, 'Choose staff or sub admin.');
    const password = req.body.password ? String(req.body.password) : '';
    if (password && passwordProblem(password)) return fail(res, 400, passwordProblem(password));
    const update = {};
    if (typeof req.body.active === 'boolean') update.active = req.body.active;
    if (v.text(req.body.name, 80)) update.name = v.text(req.body.name, 80);
    if (password) Object.assign(update, { password: hashPassword(password), invited: false, setupHash: null, setupExpires: 0 });
    if (Object.keys(update).length) await users.updateOne({ email }, { $set: update });
    if (req.body.role) await admins.updateOne({ email }, { $set: { role: req.body.role } });
    await audit(req, 'staff access edited', email); res.json(true);
  }));
  // Sub admins read the list too, to assign bookings to staff.
  app.get('/admin', requireSuperAdmin, asyncRoute(async (_req, res) => {
    const rows = await admins.find({}).toArray();
    res.json(await Promise.all(rows.map(async (row) => {
      const user = await users.findOne({ email: row.email });
      return { _id: row._id, email: row.email, name: user?.name || '', hasAccount: Boolean(user) && !user.invited, active: user?.active !== false, role: await teamRole(row.email) };
    })));
  }));
  app.delete('/deleteAdmin/:email', requireTeamAdmin, asyncRoute(async (req, res) => {
    const email = v.normalizeEmail(req.params.email);
    if (email === req.user.email) return fail(res, 400, 'You cannot remove your own admin access.');
    if ((await teamRole(email)) === 'super_admin') return fail(res, 403, 'Super admin access cannot be removed here.');
    if (!teamRoles.includes(await teamRole(email))) return fail(res, 404, 'Staff not found.');
    await users.updateOne({ email }, { $set: { active: false } });
    await audit(req, 'staff deactivated', email);
    res.json(true);
  }));
  app.post('/isAdmin', requireUser, asyncRoute(async (req, res) => res.json(can(req.role, 'manage'))));
  require('./management')(app, { db, requireUser, requireSuperAdmin, asyncRoute, fail, parseId, audit, teamRole });

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
