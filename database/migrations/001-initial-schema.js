// Every collection the API uses, with the indexes it relies on.
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

// Safe to rerun: preserve documents and reuse existing indexes.
async function up(db, log = console.log) {
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((row) => row.name));
  for (const [name, indexes] of Object.entries(collections)) {
    if (!existing.has(name)) await db.createCollection(name);
    for (const [keys, options] of indexes) await db.collection(name).createIndex(keys, options);
    log(`${name}: ${existing.has(name) ? 'already there' : 'created'}, ${indexes.length} index(es)`);
  }
}

module.exports = { collections, up };
