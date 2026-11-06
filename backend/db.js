const { MongoClient } = require('mongodb');
const { createDemoDb } = require('./demoDb');

// Atlas answers with "tlsv1 alert internal error" when the caller's IP address is not on its access list.
function explainConnectionError(error) {
  if (/alert internal error|alert number 80/i.test(error.message)) {
    return "MongoDB Atlas refused the connection because this server's IP address is not allowed. In Atlas, open Network Access and add the server's address (or 0.0.0.0/0 for hosts without fixed IPs, such as Render), then redeploy.";
  }
  if (/querySrv/i.test(error.message)) return error.message + '. Set DNS_SERVERS=8.8.8.8,1.1.1.1 if your network blocks SRV lookups.';
  if (/bad auth|authentication failed/i.test(error.message)) return 'MongoDB rejected the username or password in MONGODB_URI.';
  return error.message;
}

// Opens MongoDB, or the in-memory sample database when config.demoMode is on.
async function connect(config) {
  if (config.demoMode) return createDemoDb();
  if (!config.mongoUri) throw new Error('Set MONGODB_URI in backend/.env before starting the API.');
  const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
  } catch (error) {
    throw new Error(explainConnectionError(error));
  }
  return client.db(config.databaseName);
}

// The unique indexes the API relies on for correctness. database/migrations creates these and the rest.
async function ensureIndexes(db) {
  await db.collection('conversation').createIndex({ email: 1 }, { unique: true });
  await db.collection('user').createIndex({ email: 1 }, { unique: true });
  await db.collection('review').createIndex({ orderId: 1 }, { unique: true, partialFilterExpression: { orderId: { $type: 'string' } } });
}

module.exports = { connect, ensureIndexes, explainConnectionError };
