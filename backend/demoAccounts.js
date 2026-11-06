const { hashPassword, randomPassword } = require('./auth');

// The demo buttons on the sign-in page open these accounts through POST /demoLogin, which takes only the role.
// They have no known password: each start gives them a new random one, so they cannot be opened through /login,
// and they exist only while DEMO_ACCOUNTS allows them (see config.js).
const demoAccounts = {
  admin: { name: 'Alex Morgan', email: 'admin@dependableclean.demo', role: 'superAdmin' },
  staff: { name: 'Sam Chowdhury', email: 'staff@dependableclean.demo', role: 'staff' },
  customer: { name: 'Jamie Rivera', email: 'customer@dependableclean.demo' }
};

async function ensureDemoAccounts(db) {
  const users = db.collection('user'), admins = db.collection('admin');
  for (const account of Object.values(demoAccounts)) {
    const password = hashPassword(randomPassword());
    const existing = await users.findOne({ email: account.email });
    // Also replaces the fixed passwords older versions gave these accounts.
    if (existing) await users.updateOne({ _id: existing._id }, { $set: { password, demo: true } });
    else {
      await users.insertOne({ name: account.name, email: account.email, password, demo: true, createdAt: new Date() })
        .catch((error) => { if (error.code !== 11000) throw error; });
    }
    if (account.role && !await admins.findOne({ email: account.email })) await admins.insertOne({ email: account.email, role: account.role });
  }
}

module.exports = { demoAccounts, ensureDemoAccounts };
