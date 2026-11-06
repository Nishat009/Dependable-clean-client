const v = require('../validation');

// The signed-in person's own profile, plus the owner's business settings, reports and activity log.
module.exports = (app, { db, users, bookings, guards: { requireUser, requireSuperAdmin }, audit, asyncRoute, fail }) => {
  const settings = db.collection('settings');
  const defaults = () => ({ timezone: process.env.BUSINESS_TIMEZONE || 'Asia/Dhaka', currency: process.env.BUSINESS_CURRENCY || 'BDT' });

  app.get('/profile', requireUser, asyncRoute(async (req, res) => res.json({ name: req.user.name, email: req.user.email, phone: req.user.phone || '' })));
  // Only the name and phone can change; the filter is the caller's own account.
  app.patch('/profile', requireUser, asyncRoute(async (req, res) => {
    const name = v.text(req.body.name, 80);
    if (!name) return fail(res, 400, 'Name required.');
    await users.updateOne({ _id: req.user._id }, { $set: { name, phone: v.text(req.body.phone, 40) } });
    res.json(true);
  }));

  app.get('/activity', requireSuperAdmin, asyncRoute(async (_req, res) => res.json((await db.collection('activity').find({}).toArray()).sort(v.newestFirst))));
  app.get('/reports', requireSuperAdmin, asyncRoute(async (_req, res) => {
    const rows = await bookings.find({}).toArray();
    res.json({ bookings: rows.length, bookingValue: rows.reduce((total, row) => total + Number(row.price || 0), 0), recordedPayments: rows.reduce((total, row) => total + Number(row.paymentRecorded || 0), 0) });
  }));

  app.get('/business', asyncRoute(async (_req, res) => res.json(await settings.findOne({ key: 'business' }) || { ...defaults(), email: process.env.BUSINESS_EMAIL || '', phone: process.env.BUSINESS_PHONE || '', faq: '', cancellationPolicy: '', offers: [] })));
  app.patch('/business', requireSuperAdmin, asyncRoute(async (req, res) => {
    const existing = await settings.findOne({ key: 'business' });
    const values = { key: 'business', ...defaults(), email: v.text(req.body.email, 150), phone: v.text(req.body.phone, 40), faq: v.text(req.body.faq, 5000), cancellationPolicy: v.text(req.body.cancellationPolicy, 5000), offers: v.text(req.body.offers, 5000) };
    if (existing) await settings.updateOne({ _id: existing._id }, { $set: values });
    else await settings.insertOne(values);
    await audit(req, 'business content updated', 'business');
    res.json(values);
  }));
};
