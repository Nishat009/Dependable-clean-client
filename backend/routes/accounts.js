const crypto = require('node:crypto');
const v = require('../validation');
const { hashPassword, verifyPassword, createToken } = require('../auth');
const { demoAccounts } = require('../demoAccounts');

// Sign up, sign in, demo sign-in, sign-out and invited account setup.
// /signup, /login, /demoLogin and /setupAccount are the only public writes, and all four are rate limited.
module.exports = (app, { users, guards: { requireUser }, teamRole, limiter, demoEnabled, asyncRoute, fail }) => {
  const session = async (user) => ({
    token: createToken(user),
    user: { name: user.name, email: user.email, role: await teamRole(user.email) || 'customer', demo: Boolean(user.demo) }
  });
  const accountExists = 'An account with this email already exists. Please sign in.';

  app.get('/authOptions', (_req, res) => res.json({ demoEnabled }));

  app.post('/signup', limiter, asyncRoute(async (req, res) => {
    const name = v.text(req.body.name, 80);
    const email = v.normalizeEmail(req.body.email);
    const password = v.password(req.body.password);
    if (!name) return fail(res, 400, 'Please enter your name.');
    if (!v.isEmail(email)) return fail(res, 400, 'Please enter a valid email address.');
    if (v.passwordProblem(password)) return fail(res, 400, v.passwordProblem(password));
    const user = { name, email, password: hashPassword(password), createdAt: new Date() };
    try {
      await users.insertOne(user);
    } catch (error) {
      if (error.code === 11000) return fail(res, 409, accountExists);
      throw error;
    }
    res.json(await session(user));
  }));

  app.post('/login', limiter, asyncRoute(async (req, res) => {
    const password = v.password(req.body.password);
    if (password.length > 200) return fail(res, 400, 'Password too long.');
    const user = await users.findOne({ email: v.normalizeEmail(req.body.email) });
    // Demo accounts only open through /demoLogin; their password is random and never shown.
    if (!user || user.active === false || user.invited || user.demo || !verifyPassword(password, user.password)) return fail(res, 401, 'The email or password is not correct.');
    res.json(await session(user));
  }));

  app.post('/demoLogin', limiter, asyncRoute(async (req, res) => {
    if (!demoEnabled) return fail(res, 404, 'Demo accounts are turned off.');
    const role = String(req.body.role || '');
    if (!Object.hasOwn(demoAccounts, role)) return fail(res, 400, 'Choose the customer, staff or admin demo.');
    const user = await users.findOne({ email: demoAccounts[role].email });
    if (!user || user.active === false) return fail(res, 401, 'Account inactive.');
    res.json(await session(user));
  }));

  app.post('/setupAccount', limiter, asyncRoute(async (req, res) => {
    const setupHash = crypto.createHash('sha256').update(String(req.body.token || '')).digest('hex');
    const user = await users.findOne({ setupHash });
    const password = v.password(req.body.password);
    if (!user || user.setupExpires < Date.now() || user.active === false) return fail(res, 400, 'Setup link expired or invalid.');
    if (v.passwordProblem(password)) return fail(res, 400, v.passwordProblem(password));
    const result = await users.updateOne({ _id: user._id, setupHash }, { $set: { password: hashPassword(password), invited: false, setupHash: null, setupExpires: 0, tokenVersion: (user.tokenVersion || 0) + 1 } });
    if (!result.matchedCount) return fail(res, 409, 'Link already used.');
    res.json(true);
  }));

  app.get('/me', requireUser, asyncRoute(async (req, res) => res.json((await session(req.user)).user)));

  // Signs the account out on every device by revoking all of its tokens.
  app.post('/logoutAll', requireUser, asyncRoute(async (req, res) => {
    await users.updateOne({ _id: req.user._id }, { $set: { tokenVersion: (req.user.tokenVersion || 0) + 1 } });
    res.json(true);
  }));
};
