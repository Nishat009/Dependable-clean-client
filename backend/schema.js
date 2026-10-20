const { MongoClient } = require('mongodb');
require('dotenv').config();

if (process.env.DNS_SERVERS) require('node:dns').setServers(process.env.DNS_SERVERS.split(',').map((server) => server.trim()));

// Every collection the API uses, with the indexes it relies on. The API makes the same indexes when it starts.
const collections = {
  user: [[{ email: 1 }, { unique: true }]],              // everyone who can sign in: name, email, password hash, active, demo
  admin: [[{ email: 1 }, { unique: true }]],             // team roles: superAdmin, sub_admin or staff
  service: [],                                           // services, prices and details
  location: [[{ name: 1 }]],                             // the Dhaka service areas customers can book in
  book: [[{ email: 1 }], [{ staffEmail: 1 }], [{ status: 1 }]], // bookings and their status history
  review: [[{ orderId: 1 }, { unique: true, partialFilterExpression: { orderId: { $type: 'string' } } }]],
  conversation: [[{ email: 1 }, { unique: true }]],      // one support ticket per customer
  message: [[{ conversationId: 1 }]],                    // support chat messages
  activity: [[{ createdAt: -1 }]],                       // log of team changes
  settings: [[{ key: 1 }, { unique: true }]]             // business contact details, FAQ, policy and offers
};

// Creates the database from scratch. Running it again leaves existing data alone.
async function createSchema() {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in backend/.env before creating the database.');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(process.env.DB_NAME || 'houseCleaning');
    const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((row) => row.name));
    for (const [name, indexes] of Object.entries(collections)) {
      if (!existing.has(name)) await db.createCollection(name);
      for (const [keys, options] of indexes) await db.collection(name).createIndex(keys, options);
      console.log(`${name}: ${existing.has(name) ? 'already there' : 'created'}, ${indexes.length} index(es)`);
    }
  } finally {
    await client.close();
  }
}

createSchema().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
