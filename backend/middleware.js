const { ObjectId } = require('mongodb');
const { rateLimit } = require('express-rate-limit');
const { readToken } = require('./auth');
const { can, normalizeRole } = require('./permissions');
const { normalizeEmail } = require('./validation');

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const parseId = (value) => typeof value === 'string' && ObjectId.isValid(value) && /^[0-9a-f]{24}$/i.test(value) ? new ObjectId(value) : null;
const fail = (res, status, error) => res.status(status).json({ error });

// MongoDB treats keys such as $ne or $gt as operators. No request field may start with $ or contain a dot,
// so a body like { "email": { "$ne": null } } can never reach a query filter.
function hasOperatorKey(value, depth = 0) {
  if (depth > 20) return true;
  if (Array.isArray(value)) return value.some((item) => hasOperatorKey(item, depth + 1));
  if (value && typeof value === 'object') return Object.entries(value).some(([key, item]) => key.startsWith('$') || key.includes('.') || hasOperatorKey(item, depth + 1));
  return false;
}
const rejectOperatorKeys = (req, res, next) => hasOperatorKey(req.body) || hasOperatorKey(req.query) || hasOperatorKey(req.params)
  ? fail(res, 400, 'Request fields cannot start with $ or contain dots.')
  : next();

// Throttles the public sign-in endpoints, which run scrypt and could otherwise be brute forced or used to burn CPU.
// Each IP address and email pair gets its own budget.
const authLimiter = (limit) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `${rateLimit.ipKeyGenerator ? rateLimit.ipKeyGenerator(req.ip) : req.ip}|${normalizeEmail(req.body?.email)}`,
  handler: (_req, res) => fail(res, 429, 'Too many attempts. Please wait a few minutes and try again.')
});

// Role guards. Each guard is tagged with its name so tests and docs/ROUTES.md can prove every write route has one.
function createGuards({ users, teamRole, demoEnabled }) {
  const requireUser = asyncRoute(async (req, res, next) => {
    const token = readToken(req.headers.authorization);
    // Loads the account on every request, so deactivation, role changes and revoked tokens apply immediately.
    const user = token && await users.findOne({ email: token.email });
    if (!user || user.active === false || user.invited || (user.tokenVersion || 0) !== token.version || (user.demo && !demoEnabled)) return fail(res, 401, 'Please sign in again.');
    req.role = await teamRole(user.email) || 'customer';
    req.user = user;
    next();
  });
  const requirePermission = (permission, name) => {
    const check = (req, res, next) => can(req.role, permission) ? next() : fail(res, 403, 'Your account cannot perform this action.');
    const guard = [requireUser, check];
    check.guard = name;
    return guard;
  };
  requireUser.guard = 'requireUser';
  const requireSuperAdmin = requirePermission('manage', 'requireSuperAdmin');
  return {
    requireUser,
    requireStaff: requirePermission('jobs', 'requireStaff'),
    requireSuperAdmin,
    requireAdmin: requireSuperAdmin,
    requireTeamAdmin: requirePermission('team', 'requireTeamAdmin'),
    requireCustomer: requirePermission('book', 'requireCustomer'),
    requireSupport: requirePermission('support', 'requireSupport')
  };
}

// Reads a team member's role from the admin collection; null means a customer.
const teamRoleLookup = (admins) => async (email) => {
  const record = await admins.findOne({ email });
  return record ? normalizeRole(record.role || (record.staff ? 'staff' : 'superAdmin')) : null;
};

module.exports = { asyncRoute, parseId, fail, hasOperatorKey, rejectOperatorKeys, authLimiter, createGuards, teamRoleLookup };
