const { MongoClient } = require('mongodb');
require('dotenv').config();
const { sampleData } = require('./sampleData');

if (process.env.DNS_SERVERS) require('node:dns').setServers(process.env.DNS_SERVERS.split(',').map((server) => server.trim()));

const detailFields = ['includes', 'teamSize', 'idealFor', 'suppliesIncluded'];

// Adds the sample services, reviews and admin to MongoDB. Running it again does not create duplicates.
// Sample services that were added before services had details get the missing detail fields.
async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in backend/.env before seeding.');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(process.env.DB_NAME || 'houseCleaning');
    const sample = sampleData();
    const upsert = (collection, rows, key) => Promise.all(rows.map((row) => db.collection(collection).updateOne({ [key]: row[key] }, { $setOnInsert: row }, { upsert: true })));
    const results = {
      service: await upsert('service', sample.service, '_id'),
      review: await upsert('review', sample.review, 'comments'),
      admin: await upsert('admin', sample.admin, 'email')
    };
    for (const [name, rows] of Object.entries(results)) {
      console.log(`${name}: ${rows.filter((row) => row.upsertedCount).length} added, ${rows.filter((row) => !row.upsertedCount).length} already there`);
    }
    const details = await Promise.all(sample.service.map((service) => db.collection('service').updateOne(
      { _id: service._id, includes: { $exists: false } },
      { $set: Object.fromEntries(detailFields.map((field) => [field, service[field]])) }
    )));
    console.log(`service details: ${details.filter((row) => row.modifiedCount).length} filled in`);
  } finally {
    await client.close();
  }
}

seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
