const v = require('./validation');
const { can } = require('./permissions');
// Ticket support: each customer has one ticket. The owner and sub admins see every ticket and can assign one to a
// staff member, who then sees and answers only the tickets assigned to them.
module.exports = (app, { db, requireUser, requireSuperAdmin, asyncRoute, fail, parseId, audit, teamRole }) => {
    const conversations = db.collection('conversation'), messages = db.collection('message');
    const supportAccess = [requireUser, (req, res, next) => !can(req.role, 'support') ? fail(res, 403, 'Your account cannot open ticket support.') : next()];
    const ticketFilter = (req) => can(req.role, 'manage') ? {} : req.role === 'staff' ? { staffEmail: req.user.email } : { email: req.user.email };
    const own = async (req, res) => {
        const id = parseId(req.params.id), row = id && await conversations.findOne({ _id: id });
        const allowed = row && (can(req.role, 'manage') || (req.role === 'staff' ? row.staffEmail === req.user.email : row.email === req.user.email));
        if (!allowed) {
            fail(res, 403, 'Conversation unavailable.');
            return null;
        }
        return row;
    };
    // Customers see who on the team replied by name, never the team member's email.
    const forViewer = (req, row) => (message) => req.role === 'customer' && message.author !== row.email ? { ...message, author: 'support' } : message;
    app.get('/support', supportAccess, asyncRoute(async (req, res) => {
        const rows = await conversations.find(ticketFilter(req)).toArray();
        // The team's unread count is the customer's messages; a customer's is the team's replies.
        const isUnread = (row, m) => (req.role === 'customer' ? m.author !== req.user.email : m.author === row.email) && !(m.readBy || []).includes(req.user.email);
        res.json(await Promise.all(rows.sort(v.newestFirst).map(async (row) => {
            const ticket = { ...row, unread: (await messages.find({ conversationId: String(row._id) }).toArray()).filter(m => isUnread(row, m)).length };
            if (req.role === 'customer') { delete ticket.staffEmail; delete ticket.staffName; }
            return ticket;
        })));
    }));
    app.post('/support', supportAccess, asyncRoute(async (req, res) => {
        if (req.role !== 'customer')
            return fail(res, 403, 'Customers start conversations.');
        let row = await conversations.findOne({ email: req.user.email });
        if (!row) {
            row = { email: req.user.email, name: req.user.name, status: 'open', createdAt: new Date().toISOString() };
            try { await conversations.insertOne(row); } catch (error) { if (error.code !== 11000) throw error; row = await conversations.findOne({ email: req.user.email }); }
        }
        res.json(row);
    }));
    app.get('/support/:id/messages', supportAccess, asyncRoute(async (req, res) => {
        const row = await own(req, res);
        if (!row)
            return;
        const rows = await messages.find({ conversationId: String(row._id) }).toArray();
        for (const message of rows)
            if (!(message.readBy || []).includes(req.user.email)) {
                message.readBy = [...(message.readBy || []), req.user.email];
                await messages.updateOne({ _id: message._id }, { $addToSet: { readBy: req.user.email } });
            }
        res.json(rows.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))).map(forViewer(req, row)));
    }));
    const limits = new Map();
    app.post('/support/:id/messages', supportAccess, asyncRoute(async (req, res) => {
        const row = await own(req, res);
        if (!row)
            return;
        const text = v.text(req.body.text, 2000);
        if (!text)
            return fail(res, 400, 'Message required.');
        const now = Date.now(), recent = (limits.get(req.user.email) || []).filter(t => now - t < 60000);
        if (recent.length >= 10)
            return fail(res, 429, 'Please wait before sending more messages.');
        limits.set(req.user.email, [...recent, now]);
        const message = { conversationId: String(row._id), author: req.user.email, authorName: req.user.name, text, createdAt: new Date().toISOString(), readBy: [req.user.email] };
        await messages.insertOne(message);
        // A new message from the customer reopens a resolved ticket; a team reply leaves the status alone.
        await conversations.updateOne({ _id: row._id }, { $set: { createdAt: message.createdAt, ...(req.role === 'customer' ? { status: 'open' } : {}) } });
        res.json(forViewer(req, row)(message));
    }));
    // The owner and sub admins assign a ticket and change its status. The assigned staff member can change its status too.
    app.patch('/support/:id', supportAccess, asyncRoute(async (req, res) => {
        if (req.role === 'customer')
            return fail(res, 403, 'Only the team updates tickets.');
        const row = await own(req, res);
        if (!row)
            return;
        const update = {};
        if (req.body.status !== undefined) {
            if (!['open', 'resolved'].includes(req.body.status))
                return fail(res, 400, 'Choose open or resolved.');
            update.status = req.body.status;
        }
        if (req.body.staffEmail !== undefined) {
            if (!can(req.role, 'manage'))
                return fail(res, 403, 'Only the owner assigns tickets.');
            const email = v.normalizeEmail(req.body.staffEmail);
            if (email) {
                const staff = await db.collection('user').findOne({ email });
                if (!staff || staff.active === false || staff.invited || await teamRole(email) !== 'staff')
                    return fail(res, 400, 'Choose active staff with a completed account.');
                Object.assign(update, { staffEmail: email, staffName: staff.name });
            }
            else
                Object.assign(update, { staffEmail: null, staffName: null });
        }
        if (!Object.keys(update).length)
            return fail(res, 400, 'Nothing to update.');
        await conversations.updateOne({ _id: row._id }, { $set: update });
        await audit(req, update.staffEmail ? 'ticket assigned' : update.staffEmail === null ? 'ticket unassigned' : 'ticket ' + update.status, row._id);
        res.json(true);
    }));
    app.get('/profile', requireUser, asyncRoute(async (req, res) => res.json({ name: req.user.name, email: req.user.email, phone: req.user.phone || '' })));
    app.patch('/profile', requireUser, asyncRoute(async (req, res) => {
        const name = v.text(req.body.name, 80);
        if (!name)
            return fail(res, 400, 'Name required.');
        await db.collection('user').updateOne({ email: req.user.email }, { $set: { name, phone: v.text(req.body.phone, 40) } });
        res.json(true);
    }));
    app.get('/activity', requireSuperAdmin, asyncRoute(async (_req, res) => res.json((await db.collection('activity').find({}).toArray()).sort(v.newestFirst))));
    app.get('/reports', requireSuperAdmin, asyncRoute(async (_req, res) => {
        const rows = await db.collection('book').find({}).toArray();
        res.json({ bookings: rows.length, bookingValue: rows.reduce((total, row) => total + Number(row.price || 0), 0), recordedPayments: rows.reduce((total, row) => total + Number(row.paymentRecorded || 0), 0) });
    }));
    app.get('/business', asyncRoute(async (_req, res) => res.json(await db.collection('settings').findOne({ key: 'business' }) || { timezone: process.env.BUSINESS_TIMEZONE || 'Asia/Dhaka', currency: process.env.BUSINESS_CURRENCY || 'BDT', email: process.env.BUSINESS_EMAIL || '', phone: process.env.BUSINESS_PHONE || '', faq: '', cancellationPolicy: '', offers: [] })));
    app.patch('/business', requireSuperAdmin, asyncRoute(async (req, res) => {
        const collection = db.collection('settings');
        const existing = await collection.findOne({ key: 'business' });
        const values = { key: 'business', timezone: process.env.BUSINESS_TIMEZONE || 'Asia/Dhaka', currency: process.env.BUSINESS_CURRENCY || 'BDT', email: v.text(req.body.email, 150), phone: v.text(req.body.phone, 40), faq: v.text(req.body.faq, 5000), cancellationPolicy: v.text(req.body.cancellationPolicy, 5000), offers: v.text(req.body.offers, 5000) };
        if (existing)
            await collection.updateOne({ _id: existing._id }, { $set: values });
        else
            await collection.insertOne(values);
        await audit(req, 'business content updated', 'business');
        res.json(values);
    }));
};
