// Compound indexes that match the API's most common queries, plus $jsonSchema validators on the main collections.
// Safe to rerun. Validators use validationLevel "moderate", so documents saved before this migration are left alone
// but every new insert and every update to a valid document must pass.

const collections = {
  book: [
    [{ email: 1, createdAt: -1 }],        // a customer's bookings, newest first
    [{ staffEmail: 1, status: 1 }],       // a staff member's jobs by status
    [{ serviceId: 1 }],                   // checks before a service is deleted or archived
    [{ locationId: 1 }]                   // checks before a service area is deleted or archived
  ],
  review: [[{ status: 1 }], [{ email: 1 }]],
  message: [[{ conversationId: 1, createdAt: 1 }]],
  conversation: [[{ staffEmail: 1 }]]
};

const string = { bsonType: 'string' };
const validators = {
  user: {
    required: ['name', 'email', 'password'],
    properties: { name: string, email: { bsonType: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }, password: string, active: { bsonType: 'bool' }, tokenVersion: { bsonType: ['int', 'long', 'double'] } }
  },
  admin: {
    required: ['email', 'role'],
    properties: { email: string, role: { enum: ['superAdmin', 'super_admin', 'admin', 'sub_admin', 'staff'] } }
  },
  service: {
    required: ['serviceName', 'price'],
    properties: { serviceName: string, price: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 0 }, active: { bsonType: 'bool' } }
  },
  location: {
    required: ['name', 'thana'],
    properties: { name: string, city: string, thana: string, active: { bsonType: 'bool' } }
  },
  book: {
    required: ['serviceId', 'email', 'date', 'status'],
    properties: {
      serviceId: string, email: string, date: { bsonType: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      status: { enum: ['requested', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'Pending', 'Confirmed', 'Assigned', 'In progress', 'Completed', 'Cancelled'] },
      price: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 0 }
    }
  },
  review: {
    required: ['name', 'rating', 'comments'],
    properties: { rating: { bsonType: ['int', 'long', 'double'], minimum: 1, maximum: 5 }, comments: string, status: { enum: ['Pending', 'Approved', 'Rejected', 'Hidden'] } }
  },
  conversation: { required: ['email', 'status'], properties: { email: string, status: { enum: ['open', 'resolved'] } } },
  message: { required: ['conversationId', 'author', 'text'], properties: { conversationId: string, author: string, text: string } }
};

async function up(db, log = console.log) {
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((row) => row.name));
  for (const [name, indexes] of Object.entries(collections)) {
    if (!existing.has(name)) await db.createCollection(name);
    for (const [keys, options = {}] of indexes) await db.collection(name).createIndex(keys, options);
    log(`${name}: ${indexes.length} compound or lookup index(es)`);
  }
  for (const [name, schema] of Object.entries(validators)) {
    if (!existing.has(name) && !collections[name]) await db.createCollection(name);
    await db.command({ collMod: name, validator: { $jsonSchema: { bsonType: 'object', ...schema } }, validationLevel: 'moderate', validationAction: 'error' });
    log(`${name}: validator applied`);
  }
}

module.exports = { collections, validators, up };
