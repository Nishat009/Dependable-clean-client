const { ObjectId } = require('mongodb');
const { sampleData } = require('./sampleData');

// An in-memory stand-in for the few MongoDB collection methods the API uses, for the local preview.
// Filters only support exact matches.
function createDemoDb() {
  const sample = sampleData();
  const withId = (row) => ({ ...row, _id: row._id || new ObjectId() });
  const data = {
    service: sample.service,
    review: sample.review.map((review, index) => withId({ ...review, demo: true, createdAt: new Date(Date.now() - (index + 1) * 86400000).toISOString() })),
    book: [],
    user: [],
    admin: sample.admin.map(withId),
    location: sample.location.map(withId)
  };
  return { collection(name) {
    const rows = data[name] || (data[name] = []);
    const matches = (row, filter = {}) => Object.entries(filter).every(([key, value]) => String(row[key]) === String(value));
    return {
      find(filter = {}) { return { toArray: async () => rows.filter((row) => matches(row, filter)) }; },
      async findOne(filter) { return rows.find((row) => matches(row, filter)) || null; },
      async insertOne(value) { const row = withId(value); rows.push(row); value._id = row._id; return { insertedId: row._id }; },
      async updateOne(filter, update) {
        const row = rows.find((item) => matches(item, filter));
        if (!row) return { matchedCount: 0, modifiedCount: 0 };
        Object.assign(row, update.$set);
        return { matchedCount: 1, modifiedCount: 1 };
      },
      async createIndex() {},
      async deleteOne(filter) {
        const index = rows.findIndex((row) => matches(row, filter));
        if (index < 0) return { deletedCount: 0 };
        rows.splice(index, 1);
        return { deletedCount: 1 };
      }
    };
  } };
}

module.exports = { createDemoDb };
