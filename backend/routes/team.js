const v = require('../validation');
const { can, teamRoles } = require('../permissions');
const { hashPassword } = require('../auth');

// Team members. Only the owner (requireTeamAdmin) adds or edits staff and sub admins.
module.exports = (app, { users, admins, guards: { requireUser, requireSuperAdmin, requireTeamAdmin }, teamRole, audit, asyncRoute, fail }) => {
  // The owner sets the password, so the new staff member or sub admin can sign in with it right away.
  // An invitation that was never set up is finished the same way. Anyone else who already has an account is refused,
  // so the owner never overwrites a customer's password.
  app.post('/addAdmin', requireTeamAdmin, asyncRoute(async (req, res) => {
    const email = v.normalizeEmail(req.body.email);
    const name = v.text(req.body.name, 80);
    const password = v.password(req.body.password);
    const role = String(req.body.role || 'staff');
    if (!name) return fail(res, 400, 'Please enter a name.');
    if (name.includes('@')) return fail(res, 400, 'Enter their name, not an email address.');
    if (!v.isEmail(email)) return fail(res, 400, 'Please enter a valid email address.');
    if (!teamRoles.includes(role)) return fail(res, 400, 'Choose staff or sub admin.');
    if (v.passwordProblem(password)) return fail(res, 400, v.passwordProblem(password));
    const currentRole = await teamRole(email);
    if (currentRole === 'super_admin') return fail(res, 403, 'Owner access cannot be edited.');
    const existing = await users.findOne({ email });
    if (existing && !existing.invited) return fail(res, 409, currentRole ? 'This person is already on your team.' : 'An account with this email already exists.');
    if (existing) {
      await users.updateOne({ email }, { $set: { name, password: hashPassword(password), invited: false, active: true, setupHash: null, setupExpires: 0, tokenVersion: (existing.tokenVersion || 0) + 1 } });
    } else {
      try {
        await users.insertOne({ name, email, password: hashPassword(password), createdAt: new Date() });
      } catch (error) {
        if (error.code === 11000) return fail(res, 409, 'An account with this email already exists.');
        throw error;
      }
    }
    if (currentRole) await admins.updateOne({ email }, { $set: { role } });
    else await admins.insertOne({ email, role });
    await audit(req, role === 'sub_admin' ? 'sub admin added' : 'staff added', email);
    res.json({ email, name, role });
  }));

  // Edits a staff member or sub admin: name, role, access, or a new password when they have forgotten theirs.
  // A new password or switching access off revokes the person's existing sessions.
  app.patch('/staff/:email', requireTeamAdmin, asyncRoute(async (req, res) => {
    const email = v.normalizeEmail(req.params.email);
    if (!teamRoles.includes(await teamRole(email))) return fail(res, 403, 'Only staff and sub admins can be edited.');
    if (req.body.role !== undefined && !teamRoles.includes(req.body.role)) return fail(res, 400, 'Choose staff or sub admin.');
    const password = req.body.password ? v.password(req.body.password) : '';
    if (password && v.passwordProblem(password)) return fail(res, 400, v.passwordProblem(password));
    const user = await users.findOne({ email });
    const update = {};
    if (typeof req.body.active === 'boolean') update.active = req.body.active;
    if (v.text(req.body.name, 80)) update.name = v.text(req.body.name, 80);
    if (password) Object.assign(update, { password: hashPassword(password), invited: false, setupHash: null, setupExpires: 0 });
    if (user && (password || update.active === false)) update.tokenVersion = (user.tokenVersion || 0) + 1;
    if (Object.keys(update).length) await users.updateOne({ email }, { $set: update });
    if (req.body.role) await admins.updateOne({ email }, { $set: { role: req.body.role } });
    await audit(req, 'staff access edited', email);
    res.json(true);
  }));

  // Sub admins read the list too, to assign bookings to staff.
  app.get('/admin', requireSuperAdmin, asyncRoute(async (_req, res) => {
    const rows = await admins.find({}).toArray();
    res.json(await Promise.all(rows.map(async (row) => {
      const user = await users.findOne({ email: row.email });
      return { _id: row._id, email: row.email, name: user?.name || '', hasAccount: Boolean(user) && !user.invited, active: user?.active !== false, role: await teamRole(row.email) };
    })));
  }));

  // Removing a team member switches their account off rather than deleting it, so their job history stays.
  app.delete('/deleteAdmin/:email', requireTeamAdmin, asyncRoute(async (req, res) => {
    const email = v.normalizeEmail(req.params.email);
    if (email === req.user.email) return fail(res, 400, 'You cannot remove your own admin access.');
    const role = await teamRole(email);
    if (role === 'super_admin') return fail(res, 403, 'Super admin access cannot be removed here.');
    if (!teamRoles.includes(role)) return fail(res, 404, 'Staff not found.');
    const user = await users.findOne({ email });
    await users.updateOne({ email }, { $set: { active: false, tokenVersion: (user?.tokenVersion || 0) + 1 } });
    await audit(req, 'staff deactivated', email);
    res.json(true);
  }));

  app.post('/isAdmin', requireUser, asyncRoute(async (req, res) => res.json(can(req.role, 'manage'))));
};
