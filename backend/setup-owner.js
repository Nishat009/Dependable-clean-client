const { MongoClient } = require('mongodb');
const crypto = require('node:crypto');
const { hashPassword } = require('./auth');
const { normalizeEmail, isEmail, text } = require('./validation');
require('dotenv').config();
async function main() {
    const email = normalizeEmail(process.env.OWNER_EMAIL), name = text(process.env.OWNER_NAME, 80);
    if (!process.env.MONGODB_URI || !isEmail(email) || !name)
        throw Error('Set MONGODB_URI, OWNER_EMAIL and OWNER_NAME.');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    try {
        const db = client.db(process.env.DB_NAME || 'houseCleaning');
        const admins = db.collection('admin'), users = db.collection('user');
        const owner = (await admins.find({}).toArray()).find(r => ['superAdmin', 'super_admin', 'admin'].includes(r.role) || (!r.role && !r.staff));
        if (owner && owner.email !== email && !owner.email.endsWith('@dependableclean.demo'))
            throw Error('An owner already exists. Use that account; this command does not replace it.');
        if (owner && owner.email.endsWith('@dependableclean.demo') && owner.email !== email) {
            await users.updateOne({ email: owner.email }, { $set: { active: false } });
            await admins.updateOne({ _id: owner._id }, { $set: { role: 'staff' } });
        }
        let user = await users.findOne({ email });
        if (user && !user.invited)
            throw Error('Account already exists. Owner setup refuses to reset an existing password.');
        if (!user) {
            user = { email, name, password: hashPassword(crypto.randomBytes(32).toString('hex')), invited: true, createdAt: new Date() };
            await users.insertOne(user);
        }
        const token = crypto.randomBytes(32).toString('hex');
        await users.updateOne({ email }, { $set: { active: true, setupHash: crypto.createHash('sha256').update(token).digest('hex'), setupExpires: Date.now() + 86400000 } });
        const record = await admins.findOne({ email });
        if (record)
            await admins.updateOne({ email }, { $set: { role: 'super_admin' } });
        else
            await admins.insertOne({ email, role: 'super_admin' });
        console.log('Private owner setup URL (expires in 24 hours):');
        console.log((process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',')[0].replace(/\/$/, '') + '/setup?token=' + token);
    }
    finally {
        await client.close();
    }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
