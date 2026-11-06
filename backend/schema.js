const { upAll } = require('../database/migrations');
const { MongoClient } = require('mongodb');
require('dotenv').config({ quiet: true });

if (process.env.DNS_SERVERS) require('node:dns').setServers(process.env.DNS_SERVERS.split(',').map((server) => server.trim()));

// Creates the database from scratch. Running it again leaves existing data alone.
async function createSchema() {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in backend/.env before creating the database.');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(process.env.DB_NAME || 'houseCleaning');
    await upAll(db);
  } finally {
    await client.close();
  }
}

createSchema().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
