const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createDemoDb } = require('../demoDb');
const { createApp } = require('../app');
const { ensureDemoAccounts } = require('../demoAccounts');
const { hasOperatorKey } = require('../middleware');

const root = path.resolve(__dirname, '../..');
const publicWrites = ['POST /signup', 'POST /login', 'POST /demoLogin', 'POST /setupAccount'];
const config = { demoMode: true, demoEnabled: true, clientOrigins: ['http://localhost:3000'], authRateLimit: 5, trustProxy: 0 };
let app, server, base;

// Every route registered on the app, with the guard names found in its handler chain.
function listRoutes(expressApp) {
  return expressApp.router.stack.filter((layer) => layer.route).flatMap((layer) => Object.keys(layer.route.methods).map((method) => ({
    key: `${method.toUpperCase()} ${layer.route.path}`,
    guards: layer.route.stack.map((item) => item.handle.guard).filter(Boolean)
  })));
}

async function call(pathname, { token, method = 'GET', body } = {}) {
  const response = await fetch(base + pathname, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
const demo = async (role) => (await call('/demoLogin', { method: 'POST', body: { role } })).data.token;
const signup = async (email) => (await call('/signup', { method: 'POST', body: { name: 'Test ' + email, email, password: 'a-long-test-password' } })).data.token;

before(async () => {
  const db = createDemoDb();
  await db.collection('user').createIndex({ email: 1 }, { unique: true });
  await ensureDemoAccounts(db);
  app = createApp(db, config);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('every create, update and delete route has a role guard', () => {
  const writes = listRoutes(app).filter((route) => !route.key.startsWith('GET '));
  assert.ok(writes.length > 20);
  for (const route of writes) {
    if (publicWrites.includes(route.key)) assert.deepEqual(route.guards, [], route.key + ' is public');
    else assert.ok(route.guards.length, route.key + ' has no guard');
  }
});

test('docs/ROUTES.md lists every route with its real guard', () => {
  const doc = fs.readFileSync(path.join(root, 'docs/ROUTES.md'), 'utf8');
  const rows = new Map([...doc.matchAll(/^\| `(GET|POST|PATCH|PUT|DELETE) ([^`]+)` \| ([^|]+) \|/gm)].map((m) => [`${m[1]} ${m[2]}`, m[3].trim()]));
  for (const route of listRoutes(app)) {
    assert.ok(rows.has(route.key), route.key + ' is missing from docs/ROUTES.md');
    const guard = rows.get(route.key).replace(/`/g, '');
    assert.equal(guard, route.guards.at(-1) || 'public', route.key);
  }
  assert.equal(rows.size, listRoutes(app).length, 'docs/ROUTES.md lists routes that do not exist');
});

test('MongoDB operator keys are rejected before they reach a query', async () => {
  assert.equal(hasOperatorKey({ email: { $ne: null } }), true);
  assert.equal(hasOperatorKey({ a: [{ 'b.c': 1 }] }), true);
  assert.equal(hasOperatorKey({ email: 'a@b.co', list: ['x'] }), false);
  assert.equal((await call('/login', { method: 'POST', body: { email: { $ne: null }, password: { $ne: null } } })).status, 400);
  assert.equal((await call('/bookings/x', { token: await demo('customer') })).status, 403);
});

test('demo accounts have no usable password and open only through /demoLogin', async () => {
  // The fixed passwords older versions used must no longer open these accounts.
  for (const role of ['admin', 'staff', 'customer']) {
    const email = `${role}@dependableclean.demo`;
    assert.equal((await call('/login', { method: 'POST', body: { email, password: ['demo', role, 123].join('-') } })).status, 401);
  }
  assert.equal((await call('/demoLogin', { method: 'POST', body: { role: 'constructor' } })).status, 400);
});

test('a customer cannot read or change another customer\'s booking or ticket', async () => {
  const owner = await demo('admin');
  const [alice, bob] = [await signup('alice@example.test'), await signup('bob@example.test')];
  const service = (await call('/services')).data[0], location = (await call('/locations')).data[0];
  const { earliestBookingDate } = require('../validation');
  const booking = await call('/addAllBook', { token: alice, method: 'POST', body: { serviceId: service._id, locationId: location._id, thana: location.thana, date: earliestBookingDate(), address: 'House 1' } });
  assert.equal(booking.status, 200);
  assert.equal((await call('/bookings/' + booking.data._id, { token: bob })).status, 403);
  assert.equal((await call('/bookings/' + booking.data._id + '/request', { token: bob, method: 'POST', body: { type: 'cancellation' } })).status, 403);
  assert.equal((await call('/bookingList', { token: bob })).data.length, 0);
  assert.equal((await call('/bookings/' + booking.data._id, { token: owner })).status, 200);
  const ticket = (await call('/support', { token: alice, method: 'POST', body: {} })).data;
  assert.equal((await call('/support/' + ticket._id + '/messages', { token: bob })).status, 403);
  assert.equal((await call('/support/' + ticket._id + '/messages', { token: bob, method: 'POST', body: { text: 'Hi' } })).status, 403);
  // A service or area that bookings use is archived, not deleted.
  assert.equal((await call('/deleteClasses/' + service._id, { token: owner, method: 'DELETE' })).status, 200);
  assert.equal((await call('/serviceList', { token: owner })).data.find((row) => row._id === service._id).active, false);
  assert.equal((await call('/deleteLocation/' + location._id, { token: owner, method: 'DELETE' })).status, 200);
  assert.equal((await call('/locationList', { token: owner })).data.find((row) => row._id === location._id).active, false);
});

test('signing out everywhere revokes existing tokens', async () => {
  const token = await signup('carol@example.test');
  assert.equal((await call('/me', { token })).status, 200);
  assert.equal((await call('/logoutAll', { token, method: 'POST' })).status, 200);
  assert.equal((await call('/me', { token })).status, 401);
});

test('sign-in attempts are rate limited per IP and email', async () => {
  const body = { email: 'nobody@example.test', password: 'wrong-password-123' };
  const statuses = [];
  for (let i = 0; i < config.authRateLimit + 1; i++) statuses.push((await call('/login', { method: 'POST', body })).status);
  assert.deepEqual(statuses.slice(0, config.authRateLimit), Array(config.authRateLimit).fill(401));
  assert.equal(statuses.at(-1), 429);
});

test('production refuses to start with a missing or example AUTH_SECRET', () => {
  for (const secret of ['', 'change-me-to-a-long-random-string-0000000000', 'short']) {
    const result = spawnSync(process.execPath, ['-e', "require('./config')"], { cwd: path.join(root, 'backend'), env: { ...process.env, NODE_ENV: 'production', AUTH_SECRET: secret, MONGODB_URI: '' }, encoding: 'utf8' });
    assert.notEqual(result.status, 0, JSON.stringify(secret));
    assert.match(result.stderr, /AUTH_SECRET/);
  }
  const ok = spawnSync(process.execPath, ['-e', "require('./config')"], { cwd: path.join(root, 'backend'), env: { ...process.env, NODE_ENV: 'production', AUTH_SECRET: 'x'.repeat(64) }, encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
});

test('database/schema.sql documents the same collections and indexes as the migrations', () => {
  const { collections } = require('../../database/migrations');
  const sql = fs.readFileSync(path.join(root, 'database/schema.sql'), 'utf8');
  const tables = [...sql.matchAll(/^CREATE TABLE "?(\w+)"?/gm)].map((m) => m[1]).sort();
  assert.deepEqual(tables, Object.keys(collections).sort());
  const sqlIndexes = [...sql.matchAll(/^CREATE (?:UNIQUE )?INDEX \w+ ON "?(\w+)"? \(([^)]+)\)/gm)].map((m) => `${m[1]}(${m[2].replace(/ DESC/g, ':-1').replace(/\s/g, '')})`).sort();
  const mongoIndexes = Object.entries(collections).flatMap(([name, list]) => list.map(([keys]) => `${name}(${Object.entries(keys).map(([k, d]) => d === -1 ? k + ':-1' : k).join(',')})`)).sort();
  assert.deepEqual(sqlIndexes, mongoIndexes);
});
