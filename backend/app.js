const express = require('express');
const cors = require('cors');
const { asyncRoute, parseId, fail, rejectOperatorKeys, authLimiter, createGuards, teamRoleLookup } = require('./middleware');
const { createThanaReader } = require('./lib/dhakaThanas');

// Builds the Express app on an open database. index.js connects and listens; tests reuse it to inspect the routes.
function createApp(db, config) {
  const app = express();
  app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cors({ origin: config.clientOrigins }));
  // Express 5 leaves req.body undefined when a request has no body.
  app.use((req, _res, next) => { req.body ??= {}; next(); });
  app.use(rejectOperatorKeys);

  const mode = config.demoMode ? 'local preview' : 'database';
  app.get('/', (_req, res) => res.json({ app: 'Dependable Clean API', mode }));
  app.get('/health', (_req, res) => res.json({ ok: true, mode }));

  const collections = {
    users: db.collection('user'), admins: db.collection('admin'), services: db.collection('service'), locations: db.collection('location'),
    bookings: db.collection('book'), reviews: db.collection('review'), conversations: db.collection('conversation'), messages: db.collection('message')
  };
  const teamRole = teamRoleLookup(collections.admins);
  const ctx = {
    db, ...collections, teamRole, asyncRoute, fail, parseId,
    demoEnabled: config.demoEnabled,
    guards: createGuards({ users: collections.users, teamRole, demoEnabled: config.demoEnabled }),
    limiter: authLimiter(config.authRateLimit),
    readDhakaThanas: createThanaReader(),
    // Every change made by the team is written to the activity log.
    audit: (req, action, target) => db.collection('activity').insertOne({ actor: req.user.email, action, target: String(target), createdAt: new Date().toISOString() })
  };

  require('./routes/accounts')(app, ctx);
  Object.assign(ctx, require('./routes/locations')(app, ctx));
  require('./routes/services')(app, ctx);
  require('./routes/bookings')(app, ctx);
  require('./routes/reviews')(app, ctx);
  require('./routes/team')(app, ctx);
  require('./routes/support')(app, ctx);
  require('./routes/business')(app, ctx);

  app.use((_req, res) => fail(res, 404, 'Not found.'));
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.too.large') return fail(res, 413, 'Request too large.');
    if (err.type === 'entity.parse.failed') return fail(res, 400, 'Invalid JSON.');
    console.error(err);
    fail(res, 500, 'Internal server error.');
  });
  return app;
}

module.exports = { createApp };
