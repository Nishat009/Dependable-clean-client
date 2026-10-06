const crypto = require('node:crypto');

const tokenLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const secret = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.AUTH_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('AUTH_SECRET is not set, so everyone is signed out whenever the API restarts.');
}

// The demo buttons on the sign-in page use these accounts. The API creates them when it starts.
const demoAccounts = {
  admin: { name: 'Alex Morgan', email: 'admin@dependableclean.demo', password: 'demo-admin-123' },
  customer: { name: 'Jamie Rivera', email: 'customer@dependableclean.demo', password: 'demo-customer-123' }
};

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

const sign = (payload) => crypto.createHmac('sha256', secret).update(payload).digest('base64url');

function createToken(email) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + tokenLifetimeMs })).toString('base64url');
  return payload + '.' + sign(payload);
}

function readToken(header) {
  const [payload, signature] = String(header || '').replace(/^Bearer\s+/i, '').split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  try {
    const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return email && exp > Date.now() ? email : null;
  } catch {
    return null;
  }
}

module.exports = { demoAccounts, hashPassword, verifyPassword, createToken, readToken };
