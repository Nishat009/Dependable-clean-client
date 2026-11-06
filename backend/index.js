const config = require('./config');
const { connect, ensureIndexes } = require('./db');
const { ensureDemoAccounts } = require('./demoAccounts');
const { createApp } = require('./app');

// Starts the API: config.js checks the settings, then the database opens, demo accounts are made when allowed, and the app listens.
// The routes live in routes/*.js; docs/ROUTES.md lists every one with its guard.
async function start() {
  const db = await connect(config);
  await ensureIndexes(db);
  if (config.demoEnabled) {
    if (config.production) console.warn('DEMO_ACCOUNTS=on: demo sign-in is enabled. Use this only on a demo deployment with no real customer data.');
    await ensureDemoAccounts(db);
  }
  createApp(db, config).listen(config.port, () => console.log(`Dependable Clean API listening on http://localhost:${config.port}`));
}

start().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
