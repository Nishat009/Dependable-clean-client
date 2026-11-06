const crypto = require('node:crypto');

// Read lazily so scripts like setup-owner can hash passwords without the API's startup checks.
const secret = () => require('./config').authSecret;
const tokenLifetimeMs = 7 * 24 * 60 * 60 * 1000;

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

const sign = (payload) => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');

// The token carries the user's tokenVersion. Raising it (password change, deactivation, sign-out everywhere)
// revokes every token issued before, because requireUser compares it with the database on each request.
function createToken(user) {
  const payload = Buffer.from(JSON.stringify({ email: user.email, v: user.tokenVersion || 0, exp: Date.now() + tokenLifetimeMs })).toString('base64url');
  return payload + '.' + sign(payload);
}

// Returns { email, version } for a valid, unexpired token, otherwise null.
function readToken(header) {
  const [payload, signature] = String(header || '').replace(/^Bearer\s+/i, '').split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  try {
    const { email, v, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof email === 'string' && exp > Date.now() ? { email, version: Number(v) || 0 } : null;
  } catch {
    return null;
  }
}

const randomPassword = () => crypto.randomBytes(32).toString('base64url');

module.exports = { hashPassword, verifyPassword, createToken, readToken, randomPassword };
